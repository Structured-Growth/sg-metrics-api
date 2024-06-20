import { Metric, MetricAttributes } from "../../../database/models/metric";
import {
	autoInjectable,
	inject,
	LoggerInterface,
	NotFoundError,
	RegionEnum,
} from "@structured-growth/microservice-sdk";
import { TimestreamWrite, TimestreamQuery } from "aws-sdk";
import { MetricCreateBodyInterface } from "../../interfaces/metric-create-body.interface";
import { MetricSearchParamsInterface } from "../../interfaces/metric-search-params.interface";
import { MetricAggregateResultInterface } from "../../interfaces/metric-aggregate-result.interface";
import { MetricAggregateParamsInterface } from "../../interfaces/metric-aggregate-params.interface";
import { SearchResultInterface } from "@structured-growth/microservice-sdk";
import { v4 as uuidv4 } from "uuid";
import { isDate, parseInt } from "lodash";
import { WriteRecordsRequest } from "aws-sdk/clients/timestreamwrite";
import { ColumnInfo, Row } from "aws-sdk/clients/timestreamquery";

@autoInjectable()
export class MetricRepository {
	private configuration = {
		DatabaseName: process.env.TIMESTREAM_DB_NAME,
		TableName: process.env.TIMESTREAM_TABLE_NAME,
	};

	private writeClient: TimestreamWrite;
	private timestreamQuery: TimestreamQuery;

	constructor(@inject("region") private region: string, @inject("Logger") private logger: LoggerInterface) {
		this.writeClient = new TimestreamWrite({
			region: this.region,
		});
		this.timestreamQuery = new TimestreamQuery({
			region: this.region,
		});
	}

	public async create(params: MetricCreateBodyInterface[]): Promise<Metric[]> {
		const metrics = params.map(
			(item) =>
				new Metric({
					id: uuidv4(),
					...item,
					isDeleted: false,
				})
		);

		return this.writeRecord(metrics);
	}

	public async read(id: string): Promise<Metric | null> {
		const query = `SELECT *
                   FROM "${this.configuration.DatabaseName}"."${this.configuration.TableName}"
                   WHERE id = '${id}'
                     AND isDeleted = false
                   LIMIT 1`;
		const result = await this.executeQuery(query);

		if (result.Rows && result.Rows.length > 0) {
			return this.parseMetric(result.ColumnInfo, result.Rows[0]);
		} else {
			throw new NotFoundError(`Metric ${id} not found`);
		}
	}

	public async update(
		id: string,
		params: Partial<Pick<MetricAttributes, "value" | "takenAt" | "takenAtOffset" | "isDeleted">>
	): Promise<Metric> {
		const metric = await this.read(id);

		if (!metric) {
			throw new NotFoundError(`Metric ${id} not found`);
		}

		if (params.takenAt) {
			if (params.takenAt.getTime() !== metric.takenAt.getTime()) {
				metric.isDeleted = true;
				await this.writeRecord([metric]);
			}
		}

		metric.isDeleted = false;
		Object.assign(metric, params);
		await this.writeRecord([metric]);

		return metric;
	}

	public async delete(id: string): Promise<void> {
		const metric = await this.read(id);
		if (!metric) {
			throw new NotFoundError(`Metric ${id} not found`);
		}

		await this.update(id, {
			isDeleted: true,
		});
	}

	public async search(params: MetricSearchParamsInterface & {}): Promise<
		Omit<SearchResultInterface<Metric>, "page" | "total"> & {
			nextToken?: string;
		}
	> {
		const limit = params.limit || 20;
		let order: string[] = [];

		if (params.sort) {
			order = params.sort.map((sortParam) => {
				const [field, direction] = sortParam.split(":");
				const sortField = field === "takenAt" ? "time" : field;
				return `${sortField}:${direction.toUpperCase()}`;
			});
		} else {
			order = ["time:DESC"];
		}

		const query = this.buildQuery(params, order);
		let result;

		if (params.nextToken) {
			result = await this.executeQuery(query, limit, params.nextToken);
		} else {
			const initialResult = await this.executeQuery(query, limit);
			result = await this.executeQuery(query, limit, initialResult.NextToken);
		}

		console.log("Next Token: ", result.NextToken);

		return {
			data: this.parseResult(result.ColumnInfo, result.Rows),
			limit: limit,
			nextToken: result.NextToken,
		};
	}

	public async aggregate(
		params: MetricAggregateParamsInterface & { page?: number; limit?: number; sort?: any }
	): Promise<MetricAggregateResultInterface> {
		const limit = params.limit || 20;

		let order;
		if (params.sort && params.sort[0] === "recordedAt") {
			order = ["time", params.sort[1]];
		} else {
			order = params.sort;
		}

		let filters: string[] = [`isDeleted = false`, `measure_name = 'metric'`];

		if (params.orgId) filters.push(`orgId = '${params.orgId}'`);
		if (params.accountId) filters.push(`accountId = '${params.accountId}'`);
		if (params.userId) filters.push(`userId = '${params.userId}'`);
		if (params.metricTypeId) filters.push(`metricTypeId = '${params.metricTypeId}'`);
		if (params.metricTypeVersion) filters.push(`metricTypeVersion = '${params.metricTypeVersion}'`);
		if (params.deviceId) filters.push(`deviceId = '${params.deviceId}'`);
		if (params.batchId) filters.push(`batchId = '${params.batchId}'`);
		if (params.value) filters.push(`value = ${params.value}`);

		if (params.id && params.id.length > 0) {
			const idConditions = params.id.map((id) => `id = '${id}'`);
			filters.push(`(${idConditions.join(" OR ")})`);
		}

		if (params.valueMin !== undefined) filters.push(`value >= ${params.valueMin}`);
		if (params.valueMax !== undefined) filters.push(`value <= ${params.valueMax}`);

		if (params.recordedAtMin) {
			const recordedAtMinDate = new Date(params.recordedAtMin);
			const recordedAtMinFormatted = this.formatDateToTimestamp(recordedAtMinDate);
			filters.push(`recordedAt >= '${recordedAtMinFormatted}'`);
		}
		if (params.recordedAtMax) {
			const recordedAtMaxDate = new Date(params.recordedAtMax);
			const recordedAtMaxFormatted = this.formatDateToTimestamp(recordedAtMaxDate);
			filters.push(`recordedAt <= '${recordedAtMaxFormatted}'`);
		}

		if (params.takenAtMin) {
			const takenAtMinDate = new Date(params.takenAtMin);
			const takenAtMinISO = takenAtMinDate
				.toISOString()
				.replace("T", " ")
				.replace(/\.\d{3}Z$/, "");
			filters.push(`time >= '${takenAtMinISO}'`);
		}
		if (params.takenAtMax) {
			const takenAtMaxDate = new Date(params.takenAtMax);
			const takenAtMaxISO = takenAtMaxDate
				.toISOString()
				.replace("T", " ")
				.replace(/\.\d{3}Z$/, "");
			filters.push(`time <= '${takenAtMaxISO}'`);
		}

		const column = params.column;
		const columnAggregation = params.columnAggregation;
		const row = params.row;
		const rowAggregation = params.rowAggregation;

		let aggregationSelect: string;

		if ((column === "time" || column === "recordedAt") && row !== "value") {
			aggregationSelect = `${rowAggregation.toUpperCase()}(${column}) AS ${rowAggregation.toLowerCase()}`;
		} else {
			aggregationSelect = `${rowAggregation.toUpperCase()}(${row}) AS ${rowAggregation.toLowerCase()}`;
		}

		// if (rowAggregation.toUpperCase() === "COUNT") {
		// 	if (row === "value") {
		// 		aggregationSelect = `COUNT(*) AS count`;
		// 	} else if (row === "time" || row === "recordedAt") {
		// 		aggregationSelect = `COUNT(${row}) AS count_time`;
		// 	} else {
		// 		aggregationSelect = `COUNT(DISTINCT ${row}) AS unique_org_count`;
		// 	}
		// } else {
		// 	if ((column === "time" || column === "recordedAt") && row !== "value") {
		// 		aggregationSelect = `${rowAggregation.toUpperCase()}(${column}) AS ${rowAggregation.toLowerCase()}`;
		// 	} else {
		// 		aggregationSelect = `${rowAggregation.toUpperCase()}(${row}) AS ${rowAggregation.toLowerCase()}`;
		// 	}
		// }

		let countSelect: string;

		if (row === "value") {
			countSelect = `COUNT(*) AS count`;
		} else if (row === "time" || row === "recordedAt") {
			countSelect = `COUNT(${row}) AS count`;
		} else {
			countSelect = `COUNT(DISTINCT ${row}) AS count`;
		}

		let query = `
			SELECT
				${aggregationSelect},
				${countSelect},
				MIN(${column}) AS ${column === "time" || column === "createdAt" ? "takenAt" : column},
				MIN(takenAtOffset)   AS takenAtOffset,
				MIN(recordedAt)      AS recordedAt
			FROM "${this.configuration.DatabaseName}"."${this.configuration.TableName}"
			WHERE ${filters.join(" AND ")}
			GROUP BY ${column === "time" || column === "createdAt" ? `BIN(${column}, ${columnAggregation})` : `${column}`}
		`;

		if (order && order.length > 0) {
			let sqlOrder = order
				.map((item) => {
					const [field, order] = item.split(":");
					return `${field} ${order.toUpperCase()}`;
				})
				.join(", ");
			query += ` ORDER BY ${sqlOrder}`;
		} else {
			// query += ` ORDER BY BIN(time, ${params.aggregationInterval}) ASC`;
		}

		this.logger.debug(`Aggregate query: ${query}`);

		let result;

		if (params.nextToken) {
			result = await this.executeQuery(query, limit, params.nextToken);
		} else {
			const initialResult = await this.executeQuery(query, limit);
			result = await this.executeQuery(query, limit, initialResult.NextToken);
		}

		console.log("Result: ", result);

		this.logger.debug(`Aggregate result: ${JSON.stringify(result)}`);

		const aggregatedData = result.Rows.map((item: any) => {
			let data: any = {
				takenAtOffset: parseInt(item.Data[3].ScalarValue),
				recordedAt: new Date(item.Data[4].ScalarValue),
			};

			data[rowAggregation.toLowerCase()] = parseFloat(item.Data[0].ScalarValue);
			data["count"] = parseInt(item.Data[1].ScalarValue);
			// if (rowAggregation.toUpperCase() === "COUNT") {
			// 	if (row === "value") {
			// 		data.count = parseInt(item.Data[0].ScalarValue);
			// 	} else if (row === "time" || row === "recordedAt") {
			// 		data.count_time = parseInt(item.Data[0].ScalarValue);
			// 	} else {
			// 		data.unique_org_count = parseInt(item.Data[0].ScalarValue);
			// 	}
			// } else {
			//
			// }

			data[column === "time" || column === "createdAt" ? "takenAt" : column] = new Date(item.Data[2].ScalarValue);

			return data;
		});

		return {
			data: aggregatedData,
			limit,
			nextToken: result.NextToken,
		};
	}

	private async writeRecord(metrics: Metric[]): Promise<Metric[]> {
		const command: WriteRecordsRequest = {
			DatabaseName: this.configuration.DatabaseName,
			TableName: this.configuration.TableName,
			CommonAttributes: {
				Version: Date.now(),
			},
			Records: metrics.map((metric) => {
				metric.recordedAt = metric.recordedAt ? new Date(metric.recordedAt) : new Date();

				return {
					Dimensions: [
						{ Name: "id", Value: metric.id },
						{ Name: "orgId", Value: metric.orgId.toString() },
						{ Name: "region", Value: metric.region?.toString() || RegionEnum.US },
						{ Name: "accountId", Value: metric.accountId.toString() },
						{ Name: "userId", Value: metric.userId.toString() },
						{ Name: "relatedToRn", Value: metric.relatedToRn?.toString() || "0" },
						{ Name: "metricCategoryId", Value: metric.metricCategoryId.toString() },
						{ Name: "metricTypeId", Value: metric.metricTypeId.toString() },
						{ Name: "metricTypeVersion", Value: metric.metricTypeVersion.toString() },
						{ Name: "deviceId", Value: metric.deviceId.toString() },
						{ Name: "batchId", Value: metric.batchId.toString() },
					],
					MeasureValues: [
						{
							Name: "value",
							Value: metric.value.toString(),
							Type: "BIGINT",
						},
						{
							Name: "recordedAt",
							Value: metric.recordedAt.getTime().toString(),
							Type: "TIMESTAMP",
						},
						{
							Name: "isDeleted",
							Value: metric.isDeleted.toString(),
							Type: "BOOLEAN",
						},
						{
							Name: "takenAtOffset",
							Value: metric.takenAtOffset.toString(),
							Type: "BIGINT",
						},
					],
					MeasureName: "metric",
					MeasureValueType: "MULTI",
					Time: metric.takenAt.getTime().toString(),
					TimeUnit: "MILLISECONDS",
				};
			}),
		};

		try {
			await this.writeClient.writeRecords(command).promise();
		} catch (error) {
			console.error("Error writing records to Timestream:", error);
			if (error.RejectedRecords) {
				console.error("Rejected Records:", JSON.stringify(error.RejectedRecords, null, 2));
			}
			throw error;
		}

		return metrics;
	}

	private parseTimeInterval(timeRangeFilter: string): number {
		const match = timeRangeFilter.match(/([0-9]+)([a-zA-Z]+)/);
		if (!match) throw new Error("Invalid time range format");
		const value = parseInt(match[1]);
		const unit = match[2];
		switch (unit) {
			case "m":
				return value * 60 * 1000; // Convert minutes to milliseconds
			case "h":
				return value * 60 * 60 * 1000; // Convert hours to milliseconds
			case "d":
				return value * 24 * 60 * 60 * 1000; // Convert days to milliseconds
			default:
				throw new Error(`Invalid time range unit: ${unit}`);
		}
	}

	private formatDate(date: Date): string {
		const year = date.getFullYear();
		const month = this.padZero(date.getMonth() + 1);
		const day = this.padZero(date.getDate());
		return `${year}-${month}-${day}`;
	}

	private padZero(num: number): string {
		return num < 10 ? `0${num}` : `${num}`;
	}

	private parseMetric(columnInfo: ColumnInfo[], row: Row): Metric {
		const metricData = columnInfo.reduce((acc, item, index) => {
			if (["measure_name"].includes(item.Name)) {
				return acc;
			}

			let name = item.Name;
			if (name === "time") {
				row.Data[index].ScalarValue;
				acc["takenAt"] = new Date(row.Data[index].ScalarValue + "Z");
			} else {
				const scalarValue = row.Data[index].ScalarValue;
				const isNumeric = !isNaN(Number(scalarValue)) && !isNaN(parseFloat(scalarValue));
				acc[name] = isNumeric ? parseInt(scalarValue) : scalarValue;
			}
			return acc;
		}, {});

		return new Metric(metricData as any);
	}

	private buildQuery(params: MetricSearchParamsInterface, sort: string[]): string {
		let query = `SELECT *
                 FROM "${this.configuration.DatabaseName}"."${this.configuration.TableName}"`;
		const filters: string[] = ["isDeleted = false"];

		if (params.orgId) filters.push(`orgId = '${params.orgId}'`);
		if (params.accountId) filters.push(`accountId = '${params.accountId}'`);
		if (params.userId) filters.push(`userId = '${params.userId}'`);
		if (params.metricTypeId) filters.push(`metricTypeId = '${params.metricTypeId}'`);
		if (params.metricTypeVersion) filters.push(`metricTypeVersion = '${params.metricTypeVersion}'`);
		if (params.deviceId) filters.push(`deviceId = '${params.deviceId}'`);
		if (params.batchId) filters.push(`batchId = '${params.batchId}'`);
		if (params.value) filters.push(`value = ${params.value}`);

		if (params.id && params.id.length > 0) {
			const idConditions = params.id.map((id) => `id = '${id}'`);
			filters.push(`(${idConditions.join(" OR ")})`);
		}

		if (params.valueMin !== undefined) filters.push(`value >= ${params.valueMin}`);
		if (params.valueMax !== undefined) filters.push(`value <= ${params.valueMax}`);

		if (params.recordedAtMin) {
			const recordedAtMinDate = new Date(params.recordedAtMin);
			const recordedAtMinFormatted = this.formatDateToTimestamp(recordedAtMinDate);
			filters.push(`recordedAt >= '${recordedAtMinFormatted}'`);
		}
		if (params.recordedAtMax) {
			const recordedAtMaxDate = new Date(params.recordedAtMax);
			const recordedAtMaxFormatted = this.formatDateToTimestamp(recordedAtMaxDate);
			filters.push(`recordedAt <= '${recordedAtMaxFormatted}'`);
		}

		if (params.takenAtMin) {
			const takenAtMinDate = new Date(params.takenAtMin);
			const takenAtMinISO = takenAtMinDate
				.toISOString()
				.replace("T", " ")
				.replace(/\.\d{3}Z$/, "");
			filters.push(`time >= '${takenAtMinISO}'`);
		}
		if (params.takenAtMax) {
			const takenAtMaxDate = new Date(params.takenAtMax);
			const takenAtMaxISO = takenAtMaxDate
				.toISOString()
				.replace("T", " ")
				.replace(/\.\d{3}Z$/, "");
			filters.push(`time <= '${takenAtMaxISO}'`);
		}

		if (filters.length > 0) {
			query += ` WHERE ${filters.join(" AND ")}`;
		}

		if (sort && sort.length > 0) {
			let sqlOrder = sort
				.map((item) => {
					const [field, order] = item.split(":");
					return `${field} ${order.toUpperCase()}`;
				})
				.join(", ");
			query += ` ORDER BY ${sqlOrder}`;
		} else {
			query += ` ORDER BY time DESC`;
		}

		this.logger.debug(`Timestream query`, query);

		return query;
	}

	private formatDateToTimestamp(date) {
		const pad = (num, size) => ("000" + num).slice(size * -1);
		const year = date.getUTCFullYear();
		const month = pad(date.getUTCMonth() + 1, 2);
		const day = pad(date.getUTCDate(), 2);
		const hours = pad(date.getUTCHours(), 2);
		const minutes = pad(date.getUTCMinutes(), 2);
		const seconds = pad(date.getUTCSeconds(), 2);
		const milliseconds = pad(date.getUTCMilliseconds(), 3);
		const nanoseconds = "000000"; // Nanoseconds part will be fixed to '000000' as we don't have precision beyond milliseconds

		return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds}${nanoseconds}`;
	}

	private async executeQuery(query: string, maxRows?: number, nextToken: string = null): Promise<any> {
		try {
			const params = {
				QueryString: query,
			};

			if (maxRows) {
				params["MaxRows"] = maxRows;
			}

			if (nextToken) {
				params["NextToken"] = nextToken;
			}

			return await this.timestreamQuery.query(params).promise();
		} catch (error) {
			console.error("Error occurred while executing Timestream query:", error, "QueryString:", query);
			throw error;
		}
	}

	private parseResult(columnInfo: ColumnInfo[], result: any): Metric[] {
		const metrics: Metric[] = [];
		for (const row of result || []) {
			metrics.push(this.parseMetric(columnInfo, row));
		}
		return metrics;
	}
}

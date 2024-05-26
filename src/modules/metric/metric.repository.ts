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
					deletedAt: null,
				})
		);

		return this.writeRecord(metrics);
	}

	public async read(id: string): Promise<Metric | null> {
		const query = `SELECT *
                   FROM "${this.configuration.DatabaseName}"."${this.configuration.TableName}"
                   WHERE id = '${id}'
                     AND deletedAt = '0'
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
		params: Partial<Pick<MetricAttributes, "value" | "takenAt" | "takenAtOffset" | "deletedAt">>
	): Promise<Metric> {
		const metric = await this.read(id);
		if (!metric) {
			throw new NotFoundError(`Metric ${id} not found`);
		}

		Object.assign(metric, params);
		await this.writeRecord([metric], metric.recordedAt);

		return metric;
	}

	public async delete(id: string): Promise<void> {
		await this.update(id, {
			deletedAt: new Date(),
		});
	}

	public async search(params: MetricSearchParamsInterface & {}): Promise<SearchResultInterface<Metric>> {
		const page = params.page || 1;
		const limit = params.limit || 20;
		const offset = (page - 1) * limit;

		let order;
		if (params.sort && params.sort[0] === "recordedAt") {
			order = ["time", params.sort[1]];
		} else {
			order = params.sort;
		}

		const query = this.buildQuery(params, offset, limit, order);
		const result = await this.executeQuery(query);
		const totalCount = result.Rows.length;

		return {
			data: this.parseResult(result.ColumnInfo, result.Rows),
			page: page,
			limit: limit,
			total: totalCount,
		};
	}

	public async aggregate(
		params: MetricAggregateParamsInterface & { page?: number; limit?: number; sort?: any }
	): Promise<MetricAggregateResultInterface> {
		const page = params.page || 1;
		const limit = params.limit || 20;
		const offset = (page - 1) * limit;

		const timeRangeFilter = `ago(${params.aggregationInterval})`;
		const timeRange = params.aggregationInterval;
		const validTimeRanges = ["1m", "5m", "30m", "1h", "4h", "6h", "12h", "1d", "7d", "30d", "60d"];
		const formattedTimeRangeFilter = this.formatDate(
			new Date(new Date().getTime() - this.parseTimeInterval(timeRangeFilter))
		);

		if (!validTimeRanges.includes(timeRange)) {
			throw new Error(`Invalid time range: ${params.aggregationInterval}`);
		}

		let query = `SELECT ROUND(AVG(CASE WHEN measure_name = 'value' THEN measure_value::bigint ELSE NULL END), 2) AS avg,
                        MIN(CASE WHEN measure_name = 'value' THEN measure_value::bigint ELSE NULL END)           AS min,
                        MAX(CASE WHEN measure_name = 'value' THEN measure_value::bigint ELSE NULL END)           AS max,
                        SUM(CASE WHEN measure_name = 'value' THEN measure_value::bigint ELSE NULL END)           AS sum,
                        COUNT(*)                                                                                 AS count,
                        MIN(takenAt)                                                                             AS takenAt,
                        MIN(takenAtOffset)                                                                       AS takenAtOffset,
                        bin(time, ${params.aggregationInterval})                                                 as recordedAt
                 FROM "${this.configuration.DatabaseName}"."${this.configuration.TableName}" m
                 WHERE time >= '${formattedTimeRangeFilter}'
                   AND deletedAt = '0'
                 GROUP BY bin(time, ${params.aggregationInterval})`;

		query += ` ORDER BY bin(time, ${params.aggregationInterval}) ASC`;
		query += ` LIMIT ${limit}`;

		const result = await this.executeQuery(query);

		const aggregatedData = result.Rows.map((row: any) => ({
			avg: parseFloat(row.Data[0].ScalarValue),
			min: parseInt(row.Data[1].ScalarValue),
			max: parseInt(row.Data[2].ScalarValue),
			sum: parseInt(row.Data[3].ScalarValue),
			count: parseInt(row.Data[4].ScalarValue),
			takenAt: new Date(row.Data[5].ScalarValue),
			takenAtOffset: parseInt(row.Data[6].ScalarValue),
			recordedAt: new Date(row.Data[7].ScalarValue),
		}));

		return {
			data: aggregatedData,
			page: page,
			limit: limit,
		};
	}

	private async writeRecord(metrics: Metric[], recordedAt?: Date): Promise<Metric[]> {
		recordedAt = recordedAt || new Date();

		const command: WriteRecordsRequest = {
			DatabaseName: this.configuration.DatabaseName,
			TableName: this.configuration.TableName,
			CommonAttributes: {
				Version: Date.now(),
			},
			Records: metrics.map((metric) => ({
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
						Name: "deletedAt",
						Value: isDate(metric.deletedAt) ? metric.deletedAt.toISOString() : metric.deletedAt || "0",
						Type: "VARCHAR",
					},
					{
						Name: "takenAt",
						Value: metric.takenAt.toString(),
						Type: "VARCHAR",
					},
					{
						Name: "takenAtOffset",
						Value: metric.takenAtOffset.toString(),
						Type: "VARCHAR",
					},
				],
				MeasureName: "metric",
				MeasureValueType: "MULTI",
				Time: recordedAt.getTime().toString(),
				TimeUnit: "MILLISECONDS",
			})),
		};

		const res = await this.writeClient.writeRecords(command).promise();
		console.log(res);
		metrics.forEach((metric) => (metric.recordedAt = recordedAt));

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
			if (name === "measure_value::bigint") {
				name = "value";
			}

			if (name === "time") {
				acc["recordedAt"] = new Date(row.Data[index].ScalarValue + "Z");
			} else {
				const scalarValue = row.Data[index].ScalarValue;
				const isNumeric = !isNaN(Number(scalarValue)) && !isNaN(parseFloat(scalarValue));
				acc[name] = isNumeric ? parseInt(scalarValue) : scalarValue;
			}
			return acc;
		}, {});

		return new Metric(metricData as any);
	}

	private buildQuery(params: MetricSearchParamsInterface, offset: number, limit: number, sort: any): string {
		let query = `SELECT *
                 FROM "${this.configuration.DatabaseName}"."${this.configuration.TableName}"`;
		const filters: string[] = ["deletedAt = '0'"];

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

		if (params.takenAtMin) {
			const takenAtMinDate = new Date(params.takenAtMin);
			const takenAtMinISO = takenAtMinDate.toISOString();
			filters.push(`takenAt >= '${takenAtMinISO}'`);
		}
		if (params.takenAtMax) {
			const takenAtMaxDate = new Date(params.takenAtMax);
			const takenAtMaxISO = takenAtMaxDate.toISOString();
			filters.push(`takenAt <= '${takenAtMaxISO}'`);
		}

		if (params.recordedAtMin) {
			const recordedAtMinDate = new Date(params.recordedAtMin);
			const recordedAtMinISO = recordedAtMinDate
				.toISOString()
				.replace("T", " ")
				.replace(/\.\d{3}Z$/, "");
			filters.push(`time >= '${recordedAtMinISO}'`);
		}
		if (params.recordedAtMax) {
			const recordedAtMaxDate = new Date(params.recordedAtMax);
			const recordedAtMaxISO = recordedAtMaxDate
				.toISOString()
				.replace("T", " ")
				.replace(/\.\d{3}Z$/, "");
			filters.push(`time <= '${recordedAtMaxISO}'`);
		}

		if (filters.length > 0) {
			query += ` WHERE ${filters.join(" AND ")}`;
		}

		if (sort && sort.length > 0) {
			const orderClause = `${sort[0]} ${sort[1]}`;
			query += ` ORDER BY ${orderClause}`;
		} else {
			query += ` ORDER BY time DESC`;
		}
		//query += ` LIMIT ${limit} OFFSET ${offset}`;
		query += ` LIMIT ${limit} `;

		this.logger.debug(`Timestream query`, query);

		return query;
	}

	private async executeQuery(query: string): Promise<any> {
		try {
			const params = {
				QueryString: query,
			};

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

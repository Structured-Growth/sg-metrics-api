import { Metric, MetricAttributes, MetricCreationAttributes } from "../../../database/models/metric";
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
import {
	MetricAggregationInterface,
	MetricAggregateResultInterface,
} from "../../interfaces/metric-aggregate-result.interface";
import { MetricAggregateParamsInterface } from "../../interfaces/metric-aggregate-params.interface";
import { SearchResultInterface } from "@structured-growth/microservice-sdk";
import { v4 as uuidv4 } from "uuid";
import { parseInt } from "lodash";

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
			// credentials: {
			// 	accessKeyId: process.env.AWS_ACCESS_KEY_ID,
			// 	secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
			// 	sessionToken: process.env.AWS_SESSION_TOKEN
			// }
		});
		this.timestreamQuery = new TimestreamQuery({
			region: this.region,
			// credentials: {
			// 	accessKeyId: process.env.AWS_ACCESS_KEY_ID,
			// 	secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
			// }
		});
	}

	public async create(params: MetricCreateBodyInterface[]): Promise<Metric[]> {
		const metrics = params.map(
			(item) =>
				new Metric({
					id: uuidv4(),
					...item,
				})
		);

		return this.writeRecord(metrics);
	}

	public async read(id: number): Promise<Metric | null> {
		const query = `SELECT *
                   FROM "${this.configuration.DatabaseName}"."${this.configuration.TableName}"
                   WHERE id = '${id}'
                   LIMIT 1`;
		const result = await this.executeQuery(query);

		if (result.Rows && result.Rows.length > 0) {
			return this.parseMetric(result.Rows[0]);
		} else {
			throw new NotFoundError(`Metric ${id} not found`);
		}
	}

	public async update(id: number, params: Partial<MetricAttributes>): Promise<void> {
		// // 1. Get the original metric
		// const originalMetric = await this.read(id);
		// if (!originalMetric) {
		//     throw new NotFoundError(`Metric ${id} not found`);
		// }
		//
		// // 2. Create a new metric with updated values
		// const updatedMetric: Metric = {
		//     ...originalMetric,
		//     ...params,
		// };
		//
		// // 3. Write the updated metric as a new record
		// await this.writeRecord(updatedMetric);
		//
		// // 4. Mark the original metric as inactive
		// await this.markMetricAsInactive(originalMetric.id);
	}

	public async delete(id: number): Promise<void> {
		// // 1. Get the metric to delete
		// const metricToDelete = await this.read(id);
		// if (!metricToDelete) {
		//     throw new NotFoundError(`Metric ${id} not found`);
		// }
		//
	}

	private async markMetricAsInactive(id: number): Promise<void> {
		// 3. Update the metric's isActive attribute to false
		// const command = new WriteRecordsCommand({
		//     DatabaseName: this.databaseName,
		//     TableName: this.tableName,
		//     Records: [
		//         {
		//             Dimensions: [
		//                 { Name: 'id', Value: id.toString() },
		//             ],
		//             MeasureName: 'isActive',
		//             MeasureValue: 'false',
		//             MeasureValueType: 'BOOLEAN',
		//             Time: new Date().getTime().toString(),
		//             TimeUnit: 'MILLISECONDS',
		//         }
		//     ],
		// });
		// await this.timestreamWrite.send(command).promise();
	}

	public async search(params: MetricSearchParamsInterface & {}): Promise<SearchResultInterface<Metric>> {
		const page = params.page || 1;
		const limit = params.limit || 20;
		const offset = (page - 1) * limit;
		const where = {};
		const order = params.sort ? (params.sort.map((item) => item.split(":")) as any) : [["time", "desc"]];

		const query = this.buildQuery(params, offset, limit, order);
		const result = await this.executeQuery(query);
		return {
			data: this.parseResult(result),
			page: page,
			limit: limit,
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

		let query = `SELECT 
    
							ROUND(AVG(CASE WHEN measure_name = 'value' THEN measure_value::bigint ELSE NULL END), 2) AS avg,
							MIN(CASE WHEN measure_name = 'value' THEN measure_value::bigint ELSE NULL END) AS min,
							MAX(CASE WHEN measure_name = 'value' THEN measure_value::bigint ELSE NULL END) AS max,
							SUM(CASE WHEN measure_name = 'value' THEN measure_value::bigint ELSE NULL END) AS sum,
							COUNT(*) AS count,                  
							MIN(takenAt) AS takenAt,
							MIN(takenAtOffset) AS takenAtOffset,
							bin(time, ${params.aggregationInterval}) as recordedAt
                 FROM "${this.configuration.DatabaseName}"."${this.configuration.TableName}" m
				 WHERE time >= '${formattedTimeRangeFilter}'
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

	private async writeRecord(metrics: Metric[]): Promise<Metric[]> {
		const recordedAt = new Date();

		const command = {
			DatabaseName: this.configuration.DatabaseName,
			TableName: this.configuration.TableName,
			Records: metrics.map((metric) => ({
				Dimensions: [
					{ Name: "id", Value: metric.id },
					{ Name: "orgId", Value: metric.orgId.toString() },
					{ Name: "region", Value: metric.region?.toString() || RegionEnum.US },
					{ Name: "accountId", Value: metric.accountId.toString() },
					{ Name: "userId", Value: metric.userId.toString() },
					{ Name: "metricCategoryId", Value: metric.metricCategoryId.toString() },
					{ Name: "metricTypeId", Value: metric.metricTypeId.toString() },
					{ Name: "metricTypeVersion", Value: metric.metricTypeVersion.toString() },
					{ Name: "deviceId", Value: metric.deviceId.toString() },
					{ Name: "batchId", Value: metric.batchId.toString() },
					{ Name: "takenAt", Value: metric.takenAt.toString() },
					{ Name: "takenAtOffset", Value: metric.takenAtOffset.toString() },
					// { Name: "isActive", Value: "true".toString() },
				],
				MeasureName: "value",
				MeasureValue: metric.value.toString(),
				MeasureValueType: "BIGINT",
				Time: recordedAt.getTime().toString(),
				TimeUnit: "MILLISECONDS",
			})),
		};

		await this.writeClient.writeRecords(command).promise();
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

	private parseMetric(row: any): Metric {
		const metricData: { [key: string]: any } = {};
		const fieldNames = [
			"metricCategoryId",
			"batchId",
			"deviceId",
			"userId",
			"orgId",
			"takenAtOffset",
			"accountId",
			"metricTypeId",
			"takenAt",
			"metricTypeVersion",
			"id",
			"region",
			"nullValue",
			"declarationValue",
			"recordedAt",
			"value",
		];

		row.Data.forEach((item: any, index: number) => {
			const fieldName = fieldNames[index];
			const value = item.ScalarValue;
			metricData[fieldName] = value;
		});

		const metric: Metric = new Metric({
			metricTypeVersion: parseInt(metricData["metricTypeVersion"]),
			takenAt: new Date(metricData["takenAt"]),
			takenAtOffset: parseInt(metricData["takenAtOffset"]),
			id: metricData["id"],
			orgId: parseInt(metricData["orgId"]),
			region: metricData["region"],
			accountId: parseInt(metricData["accountId"]),
			userId: parseInt(metricData["userId"]),
			metricCategoryId: parseInt(metricData["metricCategoryId"]),
			metricTypeId: parseInt(metricData["metricTypeId"]),
			deviceId: parseInt(metricData["deviceId"]),
			batchId: metricData["batchId"],
			value: parseInt(metricData["value"]),
			recordedAt: new Date(metricData["recordedAt"]),
		});

		return metric;
	}

	private buildQuery(params: MetricSearchParamsInterface, offset: number, limit: number, sort: any): string {
		let query = `SELECT *
                 FROM "${this.configuration.DatabaseName}"."${this.configuration.TableName}"`;
		const filters: string[] = [];

		if (params.id) filters.push(`id = '${params.id}'`);
		if (params.orgId) filters.push(`orgId = '${params.orgId}'`);
		if (params.accountId) filters.push(`accountId = '${params.accountId}'`);
		if (params.userId) filters.push(`userId = '${params.userId}'`);
		if (params.metricTypeId) filters.push(`metricTypeId = '${params.metricTypeId}'`);
		if (params.metricTypeVersion) filters.push(`metricTypeVersion = '${params.metricTypeVersion}'`);
		if (params.deviceId) filters.push(`deviceId = '${params.deviceId}'`);
		if (params.batchId) filters.push(`batchId = '${params.batchId}'`);
		if (params.value) filters.push(`measure_value::bigint = ${params.value}`);

		if (params.valueMin !== undefined) filters.push(`measure_value::bigint >= ${params.valueMin}`);
		if (params.valueMax !== undefined) filters.push(`measure_value::bigint <= ${params.valueMax}`);

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
		/*
		if (params.recordedAtMin && params.recordedAtMax) {
			const recordedAtMinDate = new Date(params.recordedAtMin);
			const recordedAtMinISO = recordedAtMinDate.toISOString().replace("T", " ").replace(/\.\d{3}Z$/, "");
			const recordedAtMaxDate = new Date(params.recordedAtMax);
			const recordedAtMaxISO = recordedAtMaxDate.toISOString().replace("T", " ").replace(/\.\d{3}Z$/, "");
			filters.push(`time BETWEEN TIMESTAMP '${recordedAtMinISO}' AND TIMESTAMP '${recordedAtMaxISO}'`);
		}
*/
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

		query += ` ORDER BY ${sort.map((item: any) => `${item[0]} ${item[1]}`).join(", ")}`;
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

	private parseResult(result: any): Metric[] {
		const metrics: Metric[] = [];
		for (const row of result.Rows || []) {
			metrics.push(this.parseMetric(row));
		}
		return metrics;
	}
}

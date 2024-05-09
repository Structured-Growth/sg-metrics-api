import { Metric, MetricAttributes, MetricCreationAttributes } from "../../../database/models/metric";
import { autoInjectable, inject, NotFoundError, RegionEnum } from "@structured-growth/microservice-sdk";
import { TimestreamWrite, TimestreamQuery } from "aws-sdk";
import { MetricCreateBodyInterface } from "../../interfaces/metric-create-body.interface";
import { MetricSearchParamsInterface } from "../../interfaces/metric-search-params.interface";
import { v4 as uuidv4 } from 'uuid';
import {SearchResultInterface} from "@structured-growth/microservice-sdk/";
import {parseInt} from "lodash";

@autoInjectable()
export class MetricRepository {
	private configuration = {
		DatabaseName: process.env.TIMESTREAM_DB_NAME,
		TableName: process.env.TIMESTREAM_TABLE_NAME,
	};

	private writeClient: TimestreamWrite;
	private timestreamQuery: TimestreamQuery;

	constructor(@inject("region") private region: string) {
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

	public async create(params: MetricCreateBodyInterface): Promise<Metric> {
		const metric = new Metric({
			id: uuidv4(),
			...params
		});

		return this.writeRecord(metric);
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

	public async search(
		params: MetricSearchParamsInterface & {
		}
	): Promise<SearchResultInterface<Metric>> {
		const page = params.page || 1;
		const limit = params.limit || 20;
		const offset = (page - 1) * limit;
		const where = {};
		const order = params.sort ? (params.sort.map((item) => item.split(":")) as any) : [["createdAt", "desc"]];

		const query = this.buildQuery(params, offset, limit, order);
		const result = await this.executeQuery(query);
		return {
			data: this.parseResult(result),
			page: page,
			limit: limit,
		};
	}

	/**
	 *
	 * 1. send create metric request and receive ID in response
	 * 2. Read metric by received ID.
	 */


	private async writeRecord(metric: Metric): Promise<Metric> {
		const recordedAt = new Date();

		const command = {
			DatabaseName: this.configuration.DatabaseName,
			TableName: this.configuration.TableName,
			Records: [
				{
					Dimensions: [
						{ Name: "id", Value: metric.id },
						{ Name: "orgId", Value: metric.orgId.toString() },
						{ Name: "region", Value: metric.region?.toString() || RegionEnum.US },
						{ Name: "accountId", Value: metric.accountId.toString() },
						{ Name: "userId", Value: metric.userId.toString() },
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
				},
			],
		};

		await this.writeClient.writeRecords(command).promise();
		metric.recordedAt = recordedAt;

		return metric;
	}

	private parseMetric(row: any): Metric {
		const metricData: { [key: string]: any } = {};
		const fieldNames = [
			"metricCategoryId", "batchId", "deviceId", "userId", "orgId", "takenAtOffset",
			"accountId", "metricTypeId", "takenAt", "metricTypeVersion", "id",
			"region", "nullValue", "declarationValue", "recordedAt", "value"
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
		let query = `SELECT * FROM "${this.configuration.DatabaseName}"."${this.configuration.TableName}"`;
		const filters: string[] = [];

		if (params.id) filters.push(`id = '${params.id}'`);
		if (params.orgId) filters.push(`orgId = '${params.orgId}'`);
		if (params.accountId) filters.push(`accountId = '${params.accountId}'`);
		if (params.userId) filters.push(`userId = '${params.userId}'`);
		if (params.metricTypeId) filters.push(`metricTypeId = '${params.metricTypeId}'`);
		if (params.metricTypeVersion) filters.push(`metricTypeVersion = '${params.metricTypeVersion}'`);
		if (params.deviceId) filters.push(`deviceId = '${params.deviceId}'`);
		if (params.batchId) filters.push(`batchId = '${params.batchId}'`);
		if (params.value) filters.push(`value = ${params.value}`);
		if (params.valueMin !== undefined) filters.push(`value >= ${params.valueMin}`);
		if (params.valueMax !== undefined) filters.push(`value <= ${params.valueMax}`);

		if (params.takenAtMin) filters.push(`takenAt >= '${params.takenAtMin.toISOString()}'`);
		if (params.takenAtMax) filters.push(`takenAt <= '${params.takenAtMax.toISOString()}'`);

		if (params.recordedAtMin) filters.push(`recordedAt >= '${params.recordedAtMin.toISOString()}'`);
		if (params.recordedAtMax) filters.push(`recordedAt <= '${params.recordedAtMax.toISOString()}'`);

		if (filters.length > 0) {
			query += ` WHERE ${filters.join(" AND ")}`;
		}

		query += ` ORDER BY ${sort.map((item: any) => `${item[0]} ${item[1]}`).join(", ")}`;
		query += ` LIMIT ${limit} OFFSET ${offset}`;

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

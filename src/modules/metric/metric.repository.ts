import { Metric, MetricAttributes, MetricCreationAttributes } from "../../../database/models/metric";
import { MetricSearchParamsInterface } from "../../interfaces/metric-search-params.interface";
import { TimestreamWrite, WriteRecordsCommand, WriteRecordsInput, WriteRecordsOutput } from "aws-sdk/clients/timestreamwrite";
import { QueryExecutionContext, TimestreamQuery, TimestreamQueryClient, QueryCommand } from "aws-sdk/clients/timestreamquery";
import { NotFoundError } from "@structured-growth/microservice-sdk";

export class MetricRepository {
    private timestreamWrite: TimestreamWrite;
    private timestreamQuery: TimestreamQuery;
    private databaseName: string;
    private tableName: string;

    constructor(timestreamWrite: TimestreamWrite, timestreamQuery: TimestreamQuery, databaseName: string, tableName: string) {
        this.timestreamWrite = timestreamWrite;
        this.timestreamQuery = timestreamQuery;
        this.databaseName = databaseName;
        this.tableName = tableName;
    }

    public async create(params: MetricCreationAttributes): Promise<void> {
        const metric: Metric = new Metric(params);
        await this.writeRecord(metric);
    }

    public async read(id: number): Promise<Metric | null> {
        const query = `SELECT * FROM "${this.databaseName}"."${this.tableName}" WHERE id = ${id} LIMIT 1`;
        const result = await this.executeQuery(query);
        if (result.Rows && result.Rows.length > 0) {
            return this.parseMetric(result.Rows[0]);
        } else {
            throw new NotFoundError(`Metric ${id} not found`);
        }
    }

    public async update(id: number, params: Partial<MetricAttributes>): Promise<void> {
        // 1. Get the original metric
        const originalMetric = await this.read(id);
        if (!originalMetric) {
            throw new NotFoundError(`Metric ${id} not found`);
        }

        // 2. Create a new metric with updated values
        const updatedMetric: Metric = {
            ...originalMetric,
            ...params,
        };

        // 3. Write the updated metric as a new record
        await this.writeRecord(updatedMetric);

        // 4. Mark the original metric as inactive
        await this.markMetricAsInactive(originalMetric.id);
    }

    public async delete(id: number): Promise<void> {
        // 1. Get the metric to delete
        const metricToDelete = await this.read(id);
        if (!metricToDelete) {
            throw new NotFoundError(`Metric ${id} not found`);
        }

        // 2. Mark the metric as inactive
        await this.markMetricAsInactive(id);
    }

    private async markMetricAsInactive(id: number): Promise<void> {
        // 3. Update the metric's isActive attribute to false
        const command = new WriteRecordsCommand({
            DatabaseName: this.databaseName,
            TableName: this.tableName,
            Records: [
                {
                    Dimensions: [
                        { Name: 'id', Value: id.toString() },
                    ],
                    MeasureName: 'isActive',
                    MeasureValue: 'false',
                    MeasureValueType: 'BOOLEAN',
                    Time: new Date().getTime().toString(),
                    TimeUnit: 'MILLISECONDS',
                }
            ],
        });
        await this.timestreamWrite.send(command).promise();
    }

    public async search(params: MetricSearchParamsInterface): Promise<Metric[]> {
        const query = this.buildQuery(params);
        const result = await this.executeQuery(query);
        return this.parseResult(result);
    }

    private async writeRecord(metric: Metric): Promise<void> {
        const command = new WriteRecordsCommand({
            DatabaseName: this.databaseName,
            TableName: this.tableName,
            Records: [
                {
                    Dimensions: [
                        { Name: 'orgId', Value: metric.orgId.toString() },
                        { Name: 'region', Value: metric.region.toString() },
                        { Name: 'accountId', Value: metric.accountId.toString() },
                        { Name: 'userId', Value: metric.userId.toString() },
                        { Name: 'metricCategoryId', Value: metric.metricCategoryId.toString() },
                        { Name: 'metricTypeId', Value: metric.metricTypeId.toString() },
                        { Name: 'metricTypeVersion', Value: metric.metricTypeVersion.toString() },
                        { Name: 'deviceId', Value: metric.deviceId.toString() },
                        { Name: 'batchId', Value: metric.batchId.toString() },
                        { Name: 'takenAt', Value: metric.takenAt.toString() },
                        { Name: 'takenAtOffset', Value: metric.takenAtOffset.toString() },
                        { Name: 'isActive', Value: metric.isActive.toString() },
                    ],
                    MeasureName: 'value',
                    MeasureValue: metric.value.toString(),
                    MeasureValueType: 'BIGINT',
                    Time: metric.recordedAt.getTime().toString(),
                    TimeUnit: 'MILLISECONDS',
                }
            ],
        });
        await this.timestreamWrite.send(command).promise();
    }

    private async executeQuery(query: string): Promise<any> {
        const command = new QueryCommand({
            QueryString: query,
        });
        return this.timestreamQuery.send(command).promise();
    }

    private parseMetric(row: any): Metric {
        const metric: Metric = {
            id: parseInt(row.data[0].scalarValue),
            orgId: parseInt(row.data[1].scalarValue),
            region: row.data[2].scalarValue,
            accountId: parseInt(row.data[3].scalarValue),
            userId: parseInt(row.data[4].scalarValue),
            metricCategoryId: parseInt(row.data[5].scalarValue),
            metricTypeId: parseInt(row.data[6].scalarValue),
            metricTypeVersion: parseInt(row.data[7].scalarValue),
            deviceId: parseInt(row.data[8].scalarValue),
            batchId: row.data[9].scalarValue,
            value: parseFloat(row.data[10].scalarValue),
            takenAt: new Date(parseInt(row.data[11].scalarValue)),
            takenAtOffset: parseInt(row.data[12].scalarValue),
            recordedAt: new Date(parseInt(row.data[13].scalarValue)),
        };
        return metric;
    }

    private buildQuery(params: MetricSearchParamsInterface): string {
        let query = `SELECT * FROM "${this.databaseName}"."${this.tableName}"`;

        const filters: string[] = [];
        if (params.orgId) filters.push(`orgId = ${params.orgId}`);
        if (params.accountId) filters.push(`accountId = ${params.accountId}`);
        if (params.userId) filters.push(`userId = ${params.userId}`);
        if (params.metricCategoryId) filters.push(`metricCategoryId = ${params.metricCategoryId}`);
        if (params.metricTypeId) filters.push(`metricTypeId = ${params.metricTypeId}`);
        if (params.metricTypeVersion) filters.push(`metricTypeVersion = ${params.metricTypeVersion}`);
        if (params.deviceId) filters.push(`deviceId = ${params.deviceId}`);
        if (params.batchId) filters.push(`batchId = '${params.batchId}'`);
        if (params.value) filters.push(`value = ${params.value}`);
        if (params.takenAt) filters.push(`takenAt = '${params.takenAt.toISOString()}'`);
        if (params.takenAtOffset) filters.push(`takenAtOffset = ${params.takenAtOffset}`);
        if (params.recordedAt) filters.push(`recordedAt = '${params.recordedAt.toISOString()}'`);

        if (filters.length > 0) {
            query += ` WHERE ${filters.join(" AND ")}`;
        }

        query += " LIMIT 100";
        return query;
    }


    private parseResult(result: any): Metric[] {
        const metrics: Metric[] = [];
        for (const row of result.Rows || []) {
            metrics.push(this.parseMetric(row));
        }
        return metrics;
    }
}

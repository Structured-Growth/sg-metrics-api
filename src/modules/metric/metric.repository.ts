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
        const metric: MetricAttributes = {
            id: params.id,
            orgId: params.orgId,
            // Map other...
        };
        await this.writeRecord(metric);
    }

    public async read(id: number): Promise<Metric | null> {
        const query = `SELECT * FROM "${this.databaseName}"."${this.tableName}" WHERE id = ${id} LIMIT 1`;
        const result = await this.executeQuery(query);
        if (result.Rows && result.Rows.length > 0) {
            return this.parseMetric(result.Rows[0]);
        } else {
            return null;
        }
    }

    public async update(id: number, params: Partial<MetricAttributes>): Promise<void> {
        // Timestream doesn't support updating records directly, I need to use a workaround.
        throw new Error("Updating records directly is not supported by Timestream");
    }

    public async delete(id: number): Promise<void> {
        const metric = await this.read(id);
        if (metric) {
            metric.isActive = false;
            await this.update(id, metric);
        } else {
            throw new NotFoundError(`Metric ${id} not found`);
        }
        throw new Error("Deleting records directly is not supported by Timestream");
    }

    public async search(params: MetricSearchParamsInterface): Promise<Metric[]> {
        const query = this.buildQuery(params);
        const result = await this.executeQuery(query);
        const metrics = this.parseResult(result);

        // Filter out records that are not active
        return metrics.filter(metric => metric.isActive);
    }

    private async writeRecord(metric: Metric): Promise<void> {

        const command = new WriteRecordsCommand({
            DatabaseName: this.databaseName,
            TableName: this.tableName,
            Records: [
                {
                    Dimensions: [
                        { Name: 'orgId', Value: metric.orgId.toString() },
                        { Name: 'region', Value: metric.region },
                    ],
                    MeasureName: 'value',
                    MeasureValue: metric.value.toString(),
                    MeasureValueType: 'BIGINT',
                    Time: metric.recordedAt.getTime().toString(),
                    TimeUnit: 'MILLISECONDS',
                }
            ],
        });
        await this.timestreamWrite.send(command);
    }

    private async executeQuery(query: string): Promise<any> {
        const command = new QueryCommand({
            QueryString: query,
        });
        return this.timestreamQuery.send(command);
    }

    private parseMetric(row: any): Metric {
        // I have to implement logic to parse Timestream row into Metric object
        const metric: Metric = {
            id: row.data[0].scalarValue,
            orgId: row.data[1].scalarValue,
            // Map other...
        };
        return metric;
    }

    private buildQuery(params: MetricSearchParamsInterface): string {
        let query = `SELECT * FROM "${this.databaseName}"."${this.tableName}"`;

        if (params.orgId) {
            query += ` WHERE orgId = ${params.orgId}`;
        }
        // Add more...

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

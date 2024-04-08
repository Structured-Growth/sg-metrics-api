import { ExampleAttributes } from "../../database/models/example";

export interface MetricUpdateBodyInterface {
	accountId?: number;
	userId?: number;
	metricTypeId?: number;
	metricTypeVersion?: number;
	deviceId?: number;
	batchId?: string;
	value?: number;
	takenAt?: Date;
	takenAtOffset?: number;
}

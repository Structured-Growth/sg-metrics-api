import { DefaultSearchParamsInterface } from "@structured-growth/microservice-sdk";

export interface MetricSearchParamsInterface extends Omit<DefaultSearchParamsInterface, "accountId"> {
	orgId: number;
	metricTypeId: number;
	metricTypeVersion: number;
	accountId?: number;
	userId?: number;
	deviceId?: number;
	batchId?: string;
	value?: number;
	valueMin?: number;
	valueMax?: number;
	takenAtMin?: Date;
	takenAtMax?: Date;
	recordedAtMin?: Date;
	recordedAtMax?: Date;
}
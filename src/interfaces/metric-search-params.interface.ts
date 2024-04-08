import { DefaultSearchParamsInterface } from "@structured-growth/microservice-sdk";

export interface MetricSearchParamsInterface extends Omit<DefaultSearchParamsInterface, "orgId" | "accountId"> {
	orgId?: number;
	accountId?: number;
	userId?: number;
	metricTypeId?: number;
	metricTypeVersion?: number;
	deviceId?: number;
	batchId?: string;
	value?: number;
	takenAt?: Date;
	takenAtOffset?: number;
	recordedAt?: Date;
}
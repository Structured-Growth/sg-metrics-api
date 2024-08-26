import { DefaultSearchParamsInterface } from "@structured-growth/microservice-sdk";

export interface MetricSearchParamsInterface
	extends Omit<DefaultSearchParamsInterface, "id" | "orgId" | "accountId" | "arn"> {
	id?: string[];
	orgId?: number;
	accountId?: number[];
	userId?: number[];
	metricTypeCode?: string[];
	metricTypeId?: number[];
	metricTypeVersion?: number;
	relatedToRn?: string;
	deviceId?: number;
	batchId?: string;
	value?: number;
	valueMin?: number;
	valueMax?: number;
	takenAtMin?: Date;
	takenAtMax?: Date;
	recordedAtMin?: Date;
	recordedAtMax?: Date;
	nextToken?: string;
}

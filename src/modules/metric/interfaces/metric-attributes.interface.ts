import { RegionEnum } from "@structured-growth/microservice-sdk/.dist";

export interface MetricAttributesInterface {
	id: string;
	orgId: number;
	region: RegionEnum;
	accountId?: number;
	userId?: number;
	relatedToRn?: string;
	metricCategoryId: number;
	metricTypeId: number;
	metricTypeVersion: number;
	deviceId: number;
	batchId: string;
	value: number;
	takenAt: Date;
	takenAtOffset: number;
	recordedAt: Date;
	isDeleted: boolean;
	arn: string;
}
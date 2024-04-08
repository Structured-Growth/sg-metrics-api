import { RegionEnum } from "@structured-growth/microservice-sdk";
export interface MetricCreateBodyInterface {
	orgId: number;
	region: RegionEnum;
	accountId?: number;
	userId: number;
	metricCategoryId: number;
	metricTypeId: number;
	metricTypeVersion: number;
	deviceId: number;
	batchId: string;
	value: number;
	takenAt: Date;
	takenAtOffset: number;
}

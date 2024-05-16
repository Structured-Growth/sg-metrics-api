import { RegionEnum } from "@structured-growth/microservice-sdk";
export interface MetricCreateBodyInterface {
	orgId: number;
	region: RegionEnum;
	accountId?: number;
	/**
	 * User that submitted a metric
	 */
	userId?: number;
	metricCategoryId: number;
	metricTypeId: number;
	metricTypeVersion: number;
	deviceId: number;
	/**
	 * UUID. Should be generated on client side in order to group metrics into a single batch.
	 */
	batchId: string;
	/**
	 * An entity resource number that metric is related to.
	 */
	relatedToRn?: string;
	value: number;
	/**
	 * Taken at datetime in ISO format.
	 */
	takenAt: Date;
	/**
	 * Timezone offset in minutes.
	 */
	takenAtOffset: number;
}

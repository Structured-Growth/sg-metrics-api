import { RegionEnum } from "@structured-growth/microservice-sdk";

export interface MetricCreateBodyInterface {
	orgId: number;
	region: RegionEnum;
	accountId?: number;
	/**
	 * User that submitted a metric
	 */
	userId?: number;
	/**
	 * Resource number could be set if metric is related to particular entity.
	 */
	relatedToRn?: string;
	/**
	 * @deprecated use metricTypeCode instead
	 */
	metricCategoryId: number;
	/**
	 * @deprecated use metricTypeCode instead
	 */
	metricTypeId: number;
	/**
	 * Unique code of the metric type like "blood_pressure_high", "glucose", etc.
	 * It is unique across all organizations. May be prefixed if the same metric type should
	 * be duplicated in another organization, like "org1_blood_pressure_high".
	 */
	metricTypeCode: string;
	metricTypeVersion: number;
	deviceId?: number;
	/**
	 * UUID. Should be generated on client side in order to group metrics into a single batch.
	 */
	batchId: string;
	/**
	 * An entity resource number that metric is related to.
	 */
	value: number;
	/**
	 * Taken at datetime in ISO format. Must include user's timezone.
	 * Example: 2024-01-01T00:00:00+00:00
	 */
	takenAt: Date;
	/**
	 * Timezone offset in minutes.
	 */
	takenAtOffset: number;
	/**
	 * Custom metadata could be added to a metric
	 */
	metadata?: object;
}

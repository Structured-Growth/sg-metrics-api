import { MetricCreationAttributes } from "../../database/models/metric";

export interface MetricsUpsertBodyInterface extends Omit<MetricCreationAttributes, "recordedAt" | "metadata"> {
	recordedAt?: Date;
	metadata?: Record<string, any> | null;
}

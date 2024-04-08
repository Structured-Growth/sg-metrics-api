import { MetricCategoryAttributes } from "../../database/models/metric-category";

export interface MetricCategoryUpdateBodyInterface {
	title?: string;
	status?: MetricCategoryAttributes["status"];
	code?: number;
	metadata?: Record<string, string>;
}

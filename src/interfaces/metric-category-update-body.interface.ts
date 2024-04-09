import { MetricCategoryAttributes } from "../../database/models/metric-category.sequelize";

export interface MetricCategoryUpdateBodyInterface {
	title?: string;
	status?: MetricCategoryAttributes["status"];
	code?: number;
	metadata?: Record<string, string>;
}

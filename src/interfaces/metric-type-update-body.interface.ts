import { MetricTypeAttributes } from "../../database/models/metric-type.sequelize";

export interface MetricTypeUpdateBodyInterface {
	accountId?: number;
	metricCategoryId?: number;
	title?: string;
	code?: string;
	unit?: string;
	factor?: number;
	relatedTo?: string;
	version?: number;
	status?: MetricTypeAttributes["status"];
	metadata?: Record<string, string>;
}

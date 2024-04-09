import { MetricTypeAttributes } from "../../database/models/metric-type";

export interface MetricTypeUpdateBodyInterface {
	accountId?: number;
	metricCategoryId?: number;
	title?: string;
	code?: number;
	unit?: string;
	factor?: number;
	relatedTo?: string;
	version?: number;
	status?: MetricTypeAttributes["status"];
}

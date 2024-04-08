import { AccountAttributes } from "../../database/models/account";

export interface MetricTypeUpdateBodyInterface {
	accountId?: number;
	metricCategoryId?: number;
	title?: string;
	code?: number;
	unit?: string;
	factor?: number;
	relatedTo?: string;
	version?: number;
	status?: AccountAttributes["status"];
}

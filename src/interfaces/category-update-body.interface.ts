import { MetricCategoryAttributes } from "../../database/models/category";

export interface MetricCategoryUpdateBodyInterface {
	title?: string;
	status?: MetricCategoryAttributes["status"];
	code?: number;
}

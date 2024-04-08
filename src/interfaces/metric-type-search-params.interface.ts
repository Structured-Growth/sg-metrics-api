import { DefaultSearchParamsInterface } from "@structured-growth/microservice-sdk";
import { MetricCategoryAttributes } from "../../database/models/metric-category";

export interface MetricTypeSearchParamsInterface extends Omit<DefaultSearchParamsInterface, "orgId" | "accountId"> {
	orgId?: number;
	metricCategoryId?: number;
	status?: MetricCategoryAttributes["status"][];
	/**
	 * Wildcards and exclusions are allowed:
	 *
	 * `title: ["Starts*", "-*ends"]`
	 */
	title?: string[];
	/**
	 * Wildcards and exclusions are allowed:
	 *
	 * `name: ["Starts*", "-*ends"]`
	 */
	code?: number;
	unit?: string;
	factor?: number;
	relatedTo?: string;
	version?: number;
}

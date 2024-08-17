import { DefaultSearchParamsInterface } from "@structured-growth/microservice-sdk";
import { MetricCategoryAttributes } from "../../database/models/metric-category.sequelize";

export interface MetricTypeSearchParamsInterface extends Omit<DefaultSearchParamsInterface, "accountId"> {
	metricCategoryId?: number;
	/**
	 * Search by exact metric category code
	 */
	metricCategoryCode?: string;
	status?: MetricCategoryAttributes["status"][];
	/**
	 * Wildcards and exclusions are allowed:
	 *
	 * `title: ["Starts*", "-*ends"]`
	 */
	title?: string[];
	/**
	 * Search by exact metric type code
	 */
	code?: string[];
	accountId?: number;
	unit?: string;
	factor?: number;
	relatedTo?: string;
	version?: number;
	/**
	 * Include inherited metrics types from parent organizations.
	 *
	 * @default true
	 */
	includeInherited?: boolean;
}

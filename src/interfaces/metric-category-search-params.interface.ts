import { DefaultSearchParamsInterface } from "@structured-growth/microservice-sdk";
import { MetricCategoryAttributes } from "../../database/models/metric-category.sequelize";

export interface MetricCategorySearchParamsInterface extends Omit<DefaultSearchParamsInterface, "accountId"> {
	accountId?: number;
	status?: MetricCategoryAttributes["status"][];
	/**
	 * Wildcards and exclusions are allowed:
	 *
	 * `title: ["Starts*", "-*ends"]`
	 */
	title?: string[];
	/**
	 * Search by exact category code
	 */
	code?: string[];
	// metadata?: Record<string, string>;
	/**
	 * Include inherited metrics types from parent organizations.
	 *
	 * @default true
	 */
	includeInherited?: boolean;
}

import { DefaultSearchParamsInterface } from "@structured-growth/microservice-sdk";
import { MetricCategoryAttributes } from "../../database/models/metric-category.sequelize";

export interface MetricCategorySearchParamsInterface extends Omit<DefaultSearchParamsInterface, "orgId" | "accountId"> {
	orgId?: number;
	accountId?: number;
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
	code?: string[];
}

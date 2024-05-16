import { DefaultSearchParamsInterface } from "@structured-growth/microservice-sdk";

export interface MetricCategoryMetadataSearchParamsInterface
	extends Omit<DefaultSearchParamsInterface, "orgId" | "accountId"> {
	orgId?: number;
	metricCategoryId?: number;
	name?: string[];
	/**
	 * Wildcards and exclusions are allowed:
	 *
	 * `name: ["Starts*", "-*ends"]`
	 */
	value?: number;
}

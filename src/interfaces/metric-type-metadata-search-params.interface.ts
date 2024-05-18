import { DefaultSearchParamsInterface } from "@structured-growth/microservice-sdk";

export interface MetricTypeMetadataSearchParamsInterface
	extends Omit<DefaultSearchParamsInterface, "orgId" | "accountId"> {
	orgId?: number;
	metricCategoryId?: number;
	metricTypeId?: number;
	name?: string[];
	/**
	 * Wildcards and exclusions are allowed:
	 *
	 * `name: ["Starts*", "-*ends"]`
	 */
	value?: number;
}

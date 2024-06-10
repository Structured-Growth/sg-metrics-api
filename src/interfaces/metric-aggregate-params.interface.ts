import { MetricSearchParamsInterface } from "./metric-search-params.interface";

export interface MetricAggregateParamsInterface extends Omit<MetricSearchParamsInterface, "sort"> {
	aggregationInterval: "1m" | "5m" | "30m" | "1h" | "4h" | "6h" | "12h" | "1d" | "7d" | "30d" | "60d";
	/**
	 * Sort data by multiple fields.
	 *
	 * `sort: ["min:asc", "min:desc", "max:asc", "max:desc", "avg:asc", "avg:desc", "count:asc", "count:desc", "sum:asc", "sum:desc", "takenAt:desc", "takenAt:desc"]`
	 *
	 * @default "takenAt:desc"
	 */
	sort?: string[];
}

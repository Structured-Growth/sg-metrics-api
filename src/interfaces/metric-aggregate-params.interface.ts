import { MetricSearchParamsInterface } from "./metric-search-params.interface";

export interface MetricAggregateParamsInterface extends Omit<MetricSearchParamsInterface, "sort"> {
	column: string;
	columnAggregation: string;
	row: string;
	rowAggregation: string;
	/**
	 * Sort data by multiple fields.
	 *
	 * `sort: ["min:asc", "min:desc", "max:asc", "max:desc", "avg:asc", "avg:desc", "count:asc", "count:desc", "sum:asc", "sum:desc", "takenAt:desc", "takenAt:desc"]`
	 *
	 * @default "takenAt:desc"
	 */
	sort?: string[];
	sortBy?: "row" | "column";
}

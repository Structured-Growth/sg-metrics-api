import { MetricSearchParamsInterface } from "./metric-search-params.interface";

export interface MetricAggregateParamsInterface extends MetricSearchParamsInterface {
	aggregationInterval: "1m" | "5m" | "30m" | "1h" | "4h" | "6h" | "12h" | "1d" | "7d" | "30d" | "60d";
}

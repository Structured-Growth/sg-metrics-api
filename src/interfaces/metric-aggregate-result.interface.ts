import { SearchResultInterface } from "@structured-growth/microservice-sdk";

export interface MetricAggregationInterface {
	metricTypeId: number;
	metricTypeCode?: string;
	count: number;
	min?: number;
	max?: number;
	sum?: number;
	avg?: number;
	takenAt: Date;
	takenAtOffset: number;
	recordedAt: Date;
}

export interface MetricAggregateResultInterface extends SearchResultInterface<MetricAggregationInterface> {
	nextToken?: string;
}

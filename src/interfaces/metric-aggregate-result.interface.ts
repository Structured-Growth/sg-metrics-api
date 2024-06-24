import { SearchResultInterface } from "@structured-growth/microservice-sdk";

export interface MetricAggregationInterface {
	count: number;
	min?: number;
	max?: number;
	sum?: number;
	avg?: number;
	takenAt: Date;
	takenAtOffset: number;
	recordedAt: Date;
}

export interface MetricAggregateResultInterface
	extends Omit<SearchResultInterface<MetricAggregationInterface>, "page" | "total"> {
	nextToken?: string;
}

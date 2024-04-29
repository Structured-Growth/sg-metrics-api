import { RegionEnum } from "@structured-growth/microservice-sdk";

export interface MetricCategoryCreateBodyInterface {
	orgId: number;
	region: RegionEnum;
	title: string;
	code: string;
	status?: "active" | "inactive";
	metadata?: Record<string, string>;
}

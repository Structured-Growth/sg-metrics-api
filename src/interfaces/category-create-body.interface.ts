import { RegionEnum } from "@structured-growth/microservice-sdk";

export interface MetricCategoryCreateBodyInterface {
	orgId: number;
	region: RegionEnum;
	title: string;
	code: number;
	status?: "active" | "inactive";
}

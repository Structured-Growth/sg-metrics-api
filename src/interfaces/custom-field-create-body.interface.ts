import { RegionEnum } from "@structured-growth/microservice-sdk";

export interface CustomFieldCreateBodyInterface {
	orgId: number;
	region: RegionEnum;
	entity: string;
	title: string;
	name: string;
	schema: Record<string, unknown>;
	status: "active" | "inactive";
}

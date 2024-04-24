import {RegionEnum} from "@structured-growth/microservice-sdk";

export interface MetricTypeCreateBodyInterface {
	orgId: number;
	region: RegionEnum;
	accountId?: number;
	metricCategoryId: number;
	title: string;
	code: string;
	unit: string;
	factor: number;
	relatedTo: "Organization" | "Account" | "User" | "Device" | "Phone" | "Email" | "Group" | "GroupMember";
	version: number;
	status?: "active" | "inactive";
	metadata?: Record<string, string>;
}

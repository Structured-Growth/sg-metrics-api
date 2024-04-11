export interface MetricTypeCreateBodyInterface {
	orgId: number;
	accountId?: number;
	metricCategoryId: number;
	title: string;
	code: number;
	unit: string;
	factor: number;
	relatedTo: "Organization" | "Account" | "User" | "Device" | "Phone" | "Email" | "Group" | "GroupMember";
	version: number;
	status?: "active" | "inactive";
	metadata?: Record<string, string>;
}

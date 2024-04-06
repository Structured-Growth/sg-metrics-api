export interface MetricTypeCreateBodyInterface {
	orgId: number;
	accountId?: number;
	metricCategoryId: number;
	title: string;
	code: number;
	unit: string;
	factor: number;
	relatedTo: string;
	version: number;
	lonic_code: number;
	lonic_url: string;
	status?: "active" | "inactive";
}

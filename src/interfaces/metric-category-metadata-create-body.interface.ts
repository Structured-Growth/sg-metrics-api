
export interface MetricCategoryMetadataCreateBodyInterface {
	orgId: number;
	accountId?: number;
	metricCategoryId: number;
	name: string;
	value: string;
}

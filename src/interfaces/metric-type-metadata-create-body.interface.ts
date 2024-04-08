
export interface MetricCategoryMetadataCreateBodyInterface {
	orgId: number;
	accountId?: number;
	metricCategoryId: number;
	metricTypeId: number;
	name: string;
	value: number;
}

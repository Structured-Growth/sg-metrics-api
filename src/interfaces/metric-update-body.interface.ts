export interface MetricUpdateBodyInterface {
	accountId?: number;
	userId?: number;
	relatedTo?: string;
	metricTypeId?: number;
	metricTypeVersion?: number;
	deviceId?: number;
	batchId?: string;
	value?: number;
	takenAt?: Date;
	takenAtOffset?: number;
}

export interface MetricStatisticsBodyInterface {
	accountId: number;
	userId: number;
	startPreviousPeriod: Date;
	startCurrentPeriod: Date;
	lowThreshold: number;
	highThreshold: number;
}

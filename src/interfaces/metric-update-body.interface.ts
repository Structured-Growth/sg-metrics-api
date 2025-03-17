export interface MetricUpdateBodyInterface {
	value?: number;
	/**
	 * Date string in ISO format
	 */
	takenAt?: string;
	metricTypeCode?: string;
	metricTypeVersion?: number;
	metadata?: object;
}

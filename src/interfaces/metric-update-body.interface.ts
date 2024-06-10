export interface MetricUpdateBodyInterface {
	value?: number;
	/**
	 * Date string in ISO format
	 */
	takenAt?: string;
	takenAtOffset?: number;
}

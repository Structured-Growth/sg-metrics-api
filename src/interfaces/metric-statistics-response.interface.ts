export interface MetricStatisticsResponseInterface {
	lowValuePrevious: number;
	highValuePrevious: number;
	inRangeValuePrevious: number;
	countPreviousPeriod: number;
	startTimePrevious: Date | null;
	lowValueCurrent: number;
	highValueCurrent: number;
	inRangeValueCurrent: number;
	countCurrentPeriod: number;
	startTimeCurrent: Date | null;
}

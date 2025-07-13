export interface MetricStatisticsResponseInterface {
	lowValuePrevious: number | null;
	highValuePrevious: number | null;
	inRangeValuePrevious: number | null;
	countPreviousPeriod: number;
	startTimePrevious: Date | null;
	lowValueCurrent: number | null;
	highValueCurrent: number | null;
	inRangeValueCurrent: number | null;
	countCurrentPeriod: number;
	startTimeCurrent: Date | null;
}

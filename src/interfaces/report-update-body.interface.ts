export interface ReportUpdateBodyInterface {
	title?: string;
	inDashboard?: boolean;
	reportParameters?: string;
	metadata?: Record<string, unknown>;
}

import { RegionEnum } from "@structured-growth/microservice-sdk";
export interface ReportCreateBodyInterface {
	orgId: number;
	region: RegionEnum;
	accountId: number;
	title: string;
	inDashboard: boolean;
	reportParameters: string;
}
import { DefaultSearchParamsInterface } from "@structured-growth/microservice-sdk";

export interface ReportSearchParamsInterface extends Omit<DefaultSearchParamsInterface, "accountId" | "orgId"> {
	orgId?: number;
	accountId?: number;
	title?: string[];
	inDashboard?: boolean;
}
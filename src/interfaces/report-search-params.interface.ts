import { DefaultSearchParamsInterface } from "@structured-growth/microservice-sdk";

export interface ReportSearchParamsInterface extends Omit<DefaultSearchParamsInterface, "accountId"> {
	accountId?: number;
	title?: string[];
	inDashboard?: boolean;
}
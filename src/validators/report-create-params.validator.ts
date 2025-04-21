import { joi } from "@structured-growth/microservice-sdk";

export const ReportCreateParamsValidator = joi.object({
	query: joi.object(),
	body: joi.object({
		orgId: joi.number().positive().required().label("validator.reports.orgId"),
		region: joi.string().required().min(2).max(10).label("validator.reports.region"),
		accountId: joi.number().positive().required().label("validator.reports.accountId"),
		title: joi.string().required().max(150).label("validator.reports.title"),
		inDashboard: joi.boolean().required().label("validator.reports.inDashboard"),
		reportParameters: joi.string().required().label("validator.reports.reportParameters"),
	}),
});

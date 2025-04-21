import { joi } from "@structured-growth/microservice-sdk";

export const ReportUpdateParamsValidator = joi.object({
	reportId: joi.number().positive().required().label("validator.reports.reportId"),
	query: joi.object(),
	body: joi.object({
		title: joi.string().max(150).label("validator.reports.title"),
		inDashboard: joi.boolean().label("validator.reports.inDashboard"),
		reportParameters: joi.string().label("validator.reports.reportParameters"),
	}),
});

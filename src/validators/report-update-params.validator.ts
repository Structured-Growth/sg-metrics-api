import { joi } from "@structured-growth/microservice-sdk";

export const ReportUpdateParamsValidator = joi.object({
	reportId: joi.number().positive().required().label("Report Id"),
	query: joi.object(),
	body: joi.object({
		title: joi.string().max(150).label("Title"),
		inDashboard: joi.boolean().label("In dashboard"),
		reportParameters: joi.string().label("Report Parameters"),
	}),
});

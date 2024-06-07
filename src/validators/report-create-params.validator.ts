import { joi } from "@structured-growth/microservice-sdk";

export const ReportCreateParamsValidator = joi.object({
	query: joi.object(),
	body: joi.object({
		orgId: joi.number().positive().required().label("Organization Id"),
		region: joi.string().required().min(2).max(10).label("Region"),
		accountId: joi.number().positive().required().label("Account Id"),
		title: joi.string().required().max(150).label("Title"),
		inDashboard: joi.boolean().required().label("In dashboard"),
		reportParameters: joi.string().required().label("Report Parameters"),
	}),
});

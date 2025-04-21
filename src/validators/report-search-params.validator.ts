import { joi } from "@structured-growth/microservice-sdk";
import { CommonSearchParamsValidator } from "./common-search-params.validator";

export const ReportSearchParamsValidator = joi.object({
	query: joi
		.object({
			orgId: joi.number().positive().required().label("validator.reports.orgId"),
			accountId: joi.number().positive().label("validator.reports.accountId"),
			title: joi.array().items(joi.string().max(150)).label("validator.reports.title"),
			inDashboard: joi.boolean().label("validator.reports.inDashboard"),
		})
		.concat(CommonSearchParamsValidator),
});

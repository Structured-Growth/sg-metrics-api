import { joi } from "@structured-growth/microservice-sdk";
import { CommonSearchParamsValidator } from "./common-search-params.validator";

export const ReportSearchParamsValidator = joi.object({
	query: joi
		.object({
			orgId: joi.number().positive().required().label("Organization Id"),
			accountId: joi.number().positive().label("Account Id"),
			title: joi.array().items(joi.string().max(150)).label("Title"),
			inDashboard: joi.boolean().label("In dashboard"),
		})
		.concat(CommonSearchParamsValidator),
});
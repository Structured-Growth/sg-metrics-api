import { joi } from "@structured-growth/microservice-sdk";
import { CommonSearchParamsValidator } from "./common-search-params.validator";

export const MetricTypeSearchParamsValidator = joi.object({
	query: joi
		.object({
			orgId: joi.number().positive().label("Organization Id"),
			accountId: joi.number().positive().label("Account Id"),
			metricCategoryId: joi.number().positive().label("Metric Category Id"),
			title: joi.array().items(joi.string().max(50).required()),
			code: joi.number().positive().label("Category code"),
			unit: joi.string().max(50).label("Unit"),
			factor: joi.number().positive().label("Factor"),
			relatedTo: joi.string().max(50).label("Related To"),
			version: joi.number().positive().label("Version"),
			lonic_code: joi.number().positive().label("Lonic code"),
			lonic_url: joi.string().max(50).label("Lonic URL"),
			status: joi.array().items(joi.string().valid("active", "inactive", "archived").required().label("Status")),
		})
		.concat(CommonSearchParamsValidator),
});

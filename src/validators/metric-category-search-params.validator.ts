import { joi } from "@structured-growth/microservice-sdk";
import { CommonSearchParamsValidator } from "./common-search-params.validator";

export const MetricCategorySearchParamsValidator = joi.object({
	query: joi
		.object({
			orgId: joi.number().positive().required().label("Organization Id"),
			accountId: joi.number().positive().label("Account Id"),
			title: joi.array().items(joi.string().max(50).required()).label("Category title"),
			code: joi.array().items(joi.string().max(50).required()).label("Category code"),
			status: joi.array().items(joi.string().valid("active", "inactive", "archived").required().label("Status")),
			includeInherited: joi.boolean().label("Include inherited"),
		})
		.concat(CommonSearchParamsValidator),
});

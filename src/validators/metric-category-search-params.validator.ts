import { joi } from "@structured-growth/microservice-sdk";
import { CommonSearchParamsValidator } from "./common-search-params.validator";

export const MetricCategorySearchParamsValidator = joi.object({
	query: joi
		.object({
			orgId: joi.number().positive().required().label("validator.metricCategory.orgId"),
			accountId: joi.number().positive().label("validator.metricCategory.accountId"),
			title: joi.array().items(joi.string().max(50).required()).label("validator.metricCategory.title"),
			code: joi.array().items(joi.string().max(50).required()).label("validator.metricCategory.code"),
			status: joi
				.array()
				.items(
					joi.string().valid("active", "inactive", "archived").required().label("validator.metricCategory.status")
				),
			includeInherited: joi.boolean().label("validator.metricCategory.includeInherited"),
		})
		.concat(CommonSearchParamsValidator),
});

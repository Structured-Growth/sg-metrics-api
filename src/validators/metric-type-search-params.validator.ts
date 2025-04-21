import { joi } from "@structured-growth/microservice-sdk";
import { CommonSearchParamsValidator } from "./common-search-params.validator";

export const MetricTypeSearchParamsValidator = joi.object({
	query: joi
		.object({
			orgId: joi.number().positive().required().label("validator.metricType.orgId"),
			accountId: joi.number().positive().label("validator.metricType.accountId"),
			metricCategoryId: joi.number().positive().label("validator.metricType.metricCategoryId"),
			metricCategoryCode: joi.string().label("validator.metricType.metricCategoryCode"),
			title: joi.array().items(joi.string().max(50).required()),
			code: joi.array().items(joi.string().required().label("validator.metricType.code")),
			unit: joi.string().max(50).label("validator.metricType.unit"),
			factor: joi.number().positive().label("validator.metricType.factor"),
			relatedTo: joi.string().max(50).label("validator.metricType.relatedTo"),
			version: joi.number().positive().label("validator.metricType.version"),
			lonic_code: joi.number().positive().label("validator.metricType.lonic_code"),
			lonic_url: joi.string().max(50).label("validator.metricType.lonic_url"),
			status: joi
				.array()
				.items(joi.string().valid("active", "inactive", "archived").required().label("validator.metricType.status")),
			includeInherited: joi.boolean().label("validator.metricType.includeInherited"),
		})
		.concat(CommonSearchParamsValidator),
});

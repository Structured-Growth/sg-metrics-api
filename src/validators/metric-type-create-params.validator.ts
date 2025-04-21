import { joi } from "@structured-growth/microservice-sdk";

export const MetricTypeCreateParamsValidator = joi.object({
	query: joi.object(),
	body: joi.object({
		orgId: joi.number().positive().label("validator.metricType.orgId"),
		accountId: joi.number().positive().label("validator.metricType.accountId"),
		region: joi.string().min(2).required().label("validator.metricType.region"),
		metricCategoryId: joi.number().positive().label("validator.metricType.metricCategoryId"),
		title: joi.string().min(3).max(50).label("validator.metricType.title"),
		code: joi.string().label("validator.metricType.code"),
		unit: joi.string().max(50).label("validator.metricType.unit"),
		factor: joi.number().positive().label("validator.metricType.factor"),
		relatedTo: joi.string().max(50).label("validator.metricType.relatedTo"),
		version: joi.number().positive().label("validator.metricType.version"),
		lonic_code: joi.number().positive().label("validator.metricType.lonic_code"),
		lonic_url: joi.string().max(50).label("validator.metricType.lonic_url"),
		status: joi.string().valid("active", "inactive", "archived").label("validator.metricType.status"),
		metadata: joi.object().label("validator.metricType.metadata"),
	}),
});

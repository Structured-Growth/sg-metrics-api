import { joi } from "@structured-growth/microservice-sdk";

export const MetricTypeUpdateParamsValidator = joi.object({
	metricTypeId: joi.number().positive().required().label("validator.metricType.metricTypeId"),
	query: joi.object(),
	body: joi.object({
		accountId: joi.number().positive().label("validator.metricType.accountId"),
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

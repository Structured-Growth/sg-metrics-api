import { joi } from "@structured-growth/microservice-sdk";

export const MetricCategoryCreateParamsValidator = joi.object({
	query: joi.object(),
	body: joi.object({
		orgId: joi.number().positive().required().label("validator.metricCategory.orgId"),
		region: joi.string().min(2).required().label("validator.metricCategory.region"),
		title: joi.string().min(3).max(50).required().label("validator.metricCategory.title"),
		code: joi.string().required().label("validator.metricCategory.code"),
		status: joi.string().valid("active", "inactive").label("validator.metricCategory.status"),
		metadata: joi.object().label("validator.metricCategory.metadata"),
	}),
});

import { joi } from "@structured-growth/microservice-sdk";

export const MetricCategoryUpdateSearchParamsValidator = joi.object({
	metricCategoryId: joi.number().positive().required().label("validator.metricCategory.metricCategoryId"),
	query: joi.object(),
	body: joi.object({
		title: joi.string().min(3).max(50).label("validator.metricCategory.title"),
		status: joi.string().valid("active", "inactive", "archived").label("validator.metricCategory.status"),
		code: joi.string().label("validator.metricCategory.code"),
		metadata: joi.object().label("validator.metricCategory.metadata"),
	}),
});

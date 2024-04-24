import { joi } from "@structured-growth/microservice-sdk";

export const MetricCategoryUpdateSearchParamsValidator = joi.object({
	metricCategoryId: joi.number().positive().required().label("Metric category Id"),
	query: joi.object(),
	body: joi.object({
		title: joi.string().min(3).max(50).label("Metric category title"),
		status: joi.string().valid("active", "inactive", "archived").label("Status"),
		code: joi.number().positive().label("Metric category code"),
		metadata: joi.object().label("Metric category metadata"),
	}),
});

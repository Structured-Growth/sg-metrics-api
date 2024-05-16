import { joi } from "@structured-growth/microservice-sdk";

export const MetricCategoryCreateParamsValidator = joi.object({
	query: joi.object(),
	body: joi.object({
		orgId: joi.number().positive().required().label("Organization Id"),
		region: joi.string().min(2).required().label("Metric category region"),
		title: joi.string().min(3).max(50).required().label("Metric category title"),
		code: joi.string().required().label("Metric category code"),
		status: joi.string().valid("active", "inactive").label("Status"),
		metadata: joi.object().label("Metric category metadata"),
	}),
});

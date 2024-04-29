import { joi } from "@structured-growth/microservice-sdk";

export const MetricTypeCreateParamsValidator = joi.object({
	query: joi.object(),
	body: joi.object({
		orgId: joi.number().positive().label("Organization Id"),
		accountId: joi.number().positive().label("Account Id"),
		region: joi.string().min(2).required().label("Metric category region"),
		metricCategoryId: joi.number().positive().label("Metric category Id"),
		title: joi.string().min(3).max(50).label("Metric type title"),
		code: joi.string().label("Metric type code"),
		unit: joi.string().max(50).label("Unit"),
		factor: joi.number().positive().label("Factor"),
		relatedTo: joi.string().max(50).label("Related To"),
		version: joi.number().positive().label("Version"),
		lonic_code: joi.number().positive().label("Lonic code"),
		lonic_url: joi.string().max(50).label("Lonic URL"),
		status: joi.string().valid("active", "inactive", "archived").label("Status"),
		metadata: joi.object().label("Metric type metadata"),
	}),
});
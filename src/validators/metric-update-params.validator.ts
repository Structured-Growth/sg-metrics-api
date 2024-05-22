import { joi } from "@structured-growth/microservice-sdk";

export const MetricUpdateParamsValidator = joi.object({
	metricId: joi.string().required().label("Metric Id"),
	query: joi.object(),
	body: joi.object({
		orgId: joi.number().positive().label("Organization Id"),
		accountId: joi.number().positive().label("Account Id"),
		metricCategoryId: joi.number().positive().label("Metric Category Id"),
		metricTypeVersion: joi.number().positive().label("Metric Type Id"),
		deviceId: joi.number().positive().label("Device ID"),
		batchId: joi.string().max(50).label("Batch id"),
		value: joi.number().positive().label("Value"),
		takenAt: joi.date().iso().label("Taken at"),
		takenAtOffset: joi.number().positive().label("Taken at Offset"),
	}),
});

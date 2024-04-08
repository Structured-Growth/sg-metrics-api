import { joi } from "@structured-growth/microservice-sdk";

export const MetricCreateParamsValidator = joi.object({
	query: joi.object(),
	body: joi.object({
		orgId: joi.number().positive().required().label("Organization Id"),
		accountId: joi.number().positive().label("Account Id"),
		metricCategoryId: joi.number().positive().required().label("Metric Category Id"),
		metricTypeVersion: joi.number().positive().required().label("Metric Type Id"),
		deviceId: joi.number().positive().required().label("Device ID"),
		batchId: joi.string().max(50).required().label("Batch id"),
		value: joi.number().positive().required().label("Value"),
		takenAt: joi.date().iso().required().label("Taken at"),
		takenAtOffset: joi.number().positive().required().label("Taken at Offset"),
	}),
});
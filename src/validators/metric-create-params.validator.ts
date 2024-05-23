import { joi } from "@structured-growth/microservice-sdk";

export const MetricCreateParamsValidator = joi.object({
	query: joi.object(),
	body: joi
		.array()
		.items(
			joi
				.object({
					orgId: joi.number().positive().required().label("Organization Id"),
					region: joi.string().min(2).required().label("Metric category region"),
					accountId: joi.number().positive().label("Account Id"),
					userId: joi.number().positive().required().label("User Id"),
					metricCategoryId: joi.number().positive().required().label("Metric Category Id"),
					metricTypeId: joi.number().positive().required().label("Metric Type Id"),
					metricTypeVersion: joi.number().positive().required().label("Metric Type Version"),
					relatedToRn: joi.string().max(50).label("Related To"),
					deviceId: joi.number().positive().required().label("Device ID"),
					batchId: joi.string().max(50).required().label("Batch id"),
					value: joi.number().required().label("Value"),
					takenAt: joi.date().iso().required().label("Taken at"),
					takenAtOffset: joi.number().required().label("Taken at Offset"),
				})
				.required()
		)
		.min(1)
		.required(),
});

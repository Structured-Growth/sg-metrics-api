import { joi } from "@structured-growth/microservice-sdk";

const isoFormatWithTimezone = /^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}[+-][0-9]{2}:00$/;

export const MetricCreateParamsValidator = joi.object({
	query: joi.object(),
	body: joi
		.array()
		.items(
			joi
				.object({
					id: joi.string().uuid({ version: "uuidv4" }).label("Metric Id"),
					orgId: joi.number().positive().required().label("Organization Id"),
					region: joi.string().min(2).required().label("Metric region"),
					accountId: joi.number().positive().label("Account Id"),
					userId: joi.number().positive().required().label("User Id"),
					metricCategoryId: joi.number().positive().label("Metric Category Id"),
					metricTypeId: joi.number().positive().label("Metric Type Id"),
					metricTypeCode: joi.string().max(50).required().label("Metric Type Code"),
					metricTypeVersion: joi.number().positive().required().label("Metric Type Version"),
					relatedToRn: joi.string().max(50).label("Related To"),
					deviceId: joi.number().positive().label("Device ID"),
					batchId: joi.string().max(50).required().label("Batch id"),
					value: joi.number().required().label("Value"),
					takenAt: joi.string().regex(isoFormatWithTimezone).required().label("Taken at"),
					takenAtOffset: joi.number().label("Taken at Offset"),
					metadata: joi
						.object()
						.max(10)
						.pattern(
							/^/,
							joi.alternatives().try(joi.boolean(), joi.number(), joi.string().max(255), joi.string().isoDate())
						),
				})
				.xor("metricTypeId", "metricTypeCode")
				.required()
		)
		.min(1)
		.required(),
});

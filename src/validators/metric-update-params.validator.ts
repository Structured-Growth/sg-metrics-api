import { joi } from "@structured-growth/microservice-sdk";

const isoFormatWithTimezone = /^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\+[0-9]{2}:00$/;

export const MetricUpdateParamsValidator = joi.object({
	metricId: joi.string().required().label("Metric Id"),
	query: joi.object(),
	body: joi
		.object({
			value: joi.number().positive().label("Value"),
			takenAt: joi.string().regex(isoFormatWithTimezone).label("Taken at"),
			metricTypeCode: joi.string().max(50).label("Metric Type Code"),
			metricTypeVersion: joi.number().positive().label("Metric Type Version"),
			metadata: joi
				.object()
				.max(10)
				.pattern(
					/^/,
					joi.alternatives().try(joi.boolean(), joi.number(), joi.string().max(255), joi.string().isoDate())
				),
		})
		.with("metricTypeCode", "metricTypeVersion")
		.with("metricTypeVersion", "metricTypeCode"),
});

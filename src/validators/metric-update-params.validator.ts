import { joi } from "@structured-growth/microservice-sdk";

const isoFormatWithTimezone = /^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\+[0-9]{2}:00$/;

export const MetricUpdateParamsValidator = joi.object({
	metricId: joi.string().required().label("validator.common.id"),
	query: joi.object(),
	body: joi
		.object({
			value: joi.number().label("validator.metrics.value"),
			takenAt: joi.string().regex(isoFormatWithTimezone).label("validator.metrics.takenAt"),
			metricTypeCode: joi.string().max(50).label("validator.metrics.metricTypeCode"),
			metricTypeVersion: joi.number().positive().label("validator.metrics.metricTypeVersion"),
			metadata: joi
				.object()
				.max(10)
				.pattern(
					/^/,
					joi
						.alternatives()
						.try(joi.boolean(), joi.number(), joi.string().max(255), joi.string().isoDate())
						.allow("", null)
				),
		})
		.with("metricTypeCode", "metricTypeVersion")
		.with("metricTypeVersion", "metricTypeCode"),
});

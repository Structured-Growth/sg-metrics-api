import { joi } from "@structured-growth/microservice-sdk";

const isoFormatWithTimezone = /^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\+[0-9]{2}:00$/;

export const MetricUpdateParamsValidator = joi.object({
	metricId: joi.string().required().label("Metric Id"),
	query: joi.object(),
	body: joi.object({
		value: joi.number().positive().label("Value"),
		takenAt: joi.string().regex(isoFormatWithTimezone).required().label("Taken at"),
	}),
});

import { joi } from "@structured-growth/microservice-sdk";

const isoFormatWithTimezone = /^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}[+-][0-9]{2}:00$/;

export const MetricStatisticsParamsValidator = joi.object({
	query: joi.object(),
	body: joi.object({
		accountId: joi.number().positive().required().label("validator.metrics.accountId"),
		userId: joi.number().positive().required().label("validator.metrics.userId"),
		startPreviousPeriod: joi
			.string()
			.regex(isoFormatWithTimezone)
			.required()
			.label("validator.metrics.startPreviousPeriod"),
		startCurrentPeriod: joi
			.string()
			.regex(isoFormatWithTimezone)
			.required()
			.label("validator.metrics.startCurrentPeriod"),
		lowThreshold: joi.number().positive().required().label("validator.metrics.lowThreshold"),
		highThreshold: joi.number().positive().required().label("validator.metrics.highThreshold"),
	}),
});

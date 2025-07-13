import { joi } from "@structured-growth/microservice-sdk";

export const MetricStatisticsParamsValidator = joi.object({
	query: joi.object(),
	body: joi.object({
		accountId: joi.number().positive().required().label("validator.metrics.accountId"),
		userId: joi.number().positive().required().label("validator.metrics.userId"),
		startPreviousPeriod: joi.date().iso().required().label("validator.metrics.startPreviousPeriod"),
		startCurrentPeriod: joi.date().iso().required().label("validator.metrics.startCurrentPeriod"),
		lowThreshold: joi.number().positive().required().label("validator.metrics.lowThreshold"),
		highThreshold: joi.number().positive().required().label("validator.metrics.highThreshold"),
	}),
});

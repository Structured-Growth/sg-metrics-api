import { joi } from "@structured-growth/microservice-sdk";

export const MetricUpdateParamsValidator = joi.object({
	metricId: joi.string().required().label("Metric Id"),
	query: joi.object(),
	body: joi.object({
		value: joi.number().positive().label("Value"),
		takenAt: joi.date().iso().label("Taken at"),
		takenAtOffset: joi.number().label("Taken at Offset"),
	}),
});

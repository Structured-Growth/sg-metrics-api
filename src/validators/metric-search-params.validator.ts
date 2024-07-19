import { joi } from "@structured-growth/microservice-sdk";

export const MetricSearchParamsValidator = joi.object({
	query: joi.object({
		id: joi.array().items(joi.string().required()).label("Metric Id"),
		orgId: joi.number().positive().label("Organization Id"),
		metricTypeId: joi.array().items(joi.number().positive()).label("Metric Type Id"),
		metricTypeVersion: joi.number().positive().label("Metric Type Version"),
		accountId: joi.number().positive().label("Account Id"),
		userId: joi.number().positive().label("User Id"),
		relatedToRn: joi.string().max(50).label("Related To"),
		deviceId: joi.number().positive().label("Device ID"),
		batchId: joi.string().max(50).label("Batch id"),
		value: joi.number().label("Value"),
		valueMin: joi.number().label("Value Minimum"),
		valueMax: joi.number().label("Value Maximum"),
		takenAtMin: joi.date().iso().label("Taken at minimum"),
		takenAtMax: joi.date().iso().label("Taken at maximum"),
		takenAtOffset: joi.number().label("Taken at Offset"),
		recordedAtMin: joi.date().iso().label("Recorded at minimum"),
		recordedAtMax: joi.date().iso().label("Recorded at maximum"),
		limit: joi.number().positive().label("Limit"),
		sort: joi.array().items(joi.string().required()).label("Sort"),
		nextToken: joi.string().label("Next Token"),
	}),
});

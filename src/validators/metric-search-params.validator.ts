import { joi } from "@structured-growth/microservice-sdk";
import { CommonSearchParamsValidator } from "./common-search-params.validator";

export const MetricSearchParamsValidator = joi.object({
	query: joi
		.object({
			id: joi.string().label("Metric Id"),
			orgId: joi.number().positive().label("Organization Id"),
			metricTypeId: joi.number().positive().label("Metric Type Id"),
			accountId: joi.number().positive().label("Account Id"),
			userId: joi.number().positive().label("User Id"),
			metricTypeVersion: joi.number().positive().label("Metric Type Version"),
			deviceId: joi.number().positive().label("Device ID"),
			batchId: joi.string().max(50).label("Batch id"),
			value: joi.number().label("Value"),
			valueMin: joi.number().label("Value Minimum"),
			valueMax: joi.number().label("Value Maximum"),
			takenAt: joi.date().iso().label("Taken at"),
			takenAtMin: joi.date().iso().label("Taken at minimum"),
			takenAtMax: joi.date().iso().label("Taken at maximum"),
			takenAtOffset: joi.number().label("Taken at Offset"),
			recordedAt: joi.date().iso().label("Recorded at"),
			recordedAtMin: joi.date().iso().label("Recorded at minimum"),
			recordedAtMax: joi.date().iso().label("Recorded at maximum"),
			arn: joi.array().items(joi.string().required()).label("Entity ARNs"),
			page: joi.number().positive().label("Page"),
			limit: joi.number().positive().label("Limit"),
			sort: joi.array().items(joi.string().required()).label("Sort"),
			aggregationInterval: joi.string().valid("1m" , "5m" , "30m" , "1h" , "4h" , "6h" , "12h" , "1d" , "1w" , "1M").label("Aggregation Interval"),

	})
});

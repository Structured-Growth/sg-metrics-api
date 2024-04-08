import { joi } from "@structured-growth/microservice-sdk";
import { CommonSearchParamsValidator } from "./common-search-params.validator";

export const MetricSearchParamsValidator = joi.object({
	query: joi
		.object({
			orgId: joi.number().positive().label("Organization Id"),
			accountId: joi.number().positive().label("Account Id"),
			metricCategoryId: joi.number().positive().label("Metric Category Id"),
			metricTypeVersion: joi.number().positive().label("Metric Type Id"),
			deviceId: joi.number().positive().label("Device ID"),
			batchId: joi.string().max(50).label("Batch id"),
			value: joi.number().positive().label("Value"),
			takenAt: joi.date().iso().label("Taken at"),
			takenAtOffset: joi.number().positive().label("Taken at Offset"),
			recordedAt: joi.date().iso().label("Recorded at"),
	})
		.concat(CommonSearchParamsValidator),
});

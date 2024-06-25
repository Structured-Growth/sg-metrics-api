import { joi } from "@structured-growth/microservice-sdk";

export const MetricAggregateParamsValidator = joi.object({
	query: joi.object({
		id: joi.array().items(joi.string().required()).label("Metric Id"),
		orgId: joi.number().positive().label("Organization Id"),
		metricTypeId: joi.number().positive().label("Metric Type Id"),
		accountId: joi.number().positive().label("Account Id"),
		userId: joi.number().positive().label("User Id"),
		relatedToRn: joi.string().max(50).label("Related To"),
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
		sort: joi
			.array()
			.items(
				joi
					.string()
					.required()
					.valid(
						"min:asc",
						"min:desc",
						"max:asc",
						"max:desc",
						"avg:asc",
						"avg:desc",
						"count:asc",
						"count:desc",
						"sum:asc",
						"sum:desc",
						"takenAt:asc",
						"takenAt:desc"
					)
			)
			.label("Sort"),
		column: joi
			.string()
			.valid(
				"time",
				"recordedAt",
				"id",
				"orgId",
				"accountId",
				"userId",
				"value",
				"deviceId",
				"metricTypeId",
				"metricTypeVersion"
			)
			.required()
			.label("Column"),
		row: joi
			.string()
			.valid(
				"time",
				"recordedAt",
				"id",
				"orgId",
				"accountId",
				"userId",
				"value",
				"deviceId",
				"metricTypeId",
				"metricTypeVersion"
			)
			.required()
			.label("Row"),
		columnAggregation: joi
			.string()
			.valid("1m", "5m", "30m", "1h", "4h", "6h", "12h", "1d", "7d", "30d", "60d")
			.label("Aggregate Column"),
		rowAggregation: joi.string().valid("avg", "min", "max", "sum", "count").label("Aggregate Row"),
		nextToken: joi.string().label("Next Token"),
	}),
});

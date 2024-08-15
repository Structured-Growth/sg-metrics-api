import { joi } from "@structured-growth/microservice-sdk";

export const MetricAggregateParamsValidator = joi.object({
	query: joi.object({
		id: joi.array().items(joi.string().required()).label("Metric Id"),
		orgId: joi.number().positive().label("Organization Id"),
		metricTypeId: joi.array().items(joi.number().positive()).label("Metric Type Id"),
		metricTypeCode: joi.array().items(joi.string().max(50).min(1)).label("Metric Type Code"),
		metricTypeVersion: joi.number().positive().label("Metric Type Version"),
		accountId: joi.array().items(joi.number().positive()).label("Account Id"),
		userId: joi.array().items(joi.number().positive()).label("User Id"),
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
				"metricTypeVersion",
				"relatedToRn"
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
				"metricTypeVersion",
				"relatedToRn"
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

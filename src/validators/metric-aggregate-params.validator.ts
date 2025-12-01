import { joi } from "@structured-growth/microservice-sdk";

export const MetricAggregateParamsValidator = joi.object({
	query: joi.object({
		id: joi.array().items(joi.string().required()).label("validator.common.id"),
		orgId: joi.number().positive().label("validator.metrics.orgId"),
		metricCategoryId: joi.number().positive().label("validator.metrics.metricCategoryId"),
		metricCategoryCode: joi.string().max(50).min(1).label("validator.metrics.metricCategoryCode"),
		metricTypeId: joi.array().items(joi.number().positive()).label("validator.metrics.metricTypeId"),
		metricTypeCode: joi.array().items(joi.string().max(50).min(1)).label("validator.metrics.metricTypeCode"),
		metricTypeVersion: joi.number().positive().label("validator.metrics.metricTypeVersion"),
		accountId: joi.array().items(joi.number().positive()).label("validator.metrics.accountId"),
		userId: joi.array().items(joi.number().positive()).label("validator.metrics.userId"),
		relatedToRn: joi.string().max(50).label("validator.metrics.relatedToRn"),
		deviceId: joi.number().positive().label("validator.metrics.deviceId"),
		batchId: joi.string().max(50).label("validator.metrics.batchId"),
		value: joi.number().label("validator.metrics.value"),
		valueMin: joi.number().label("validator.metrics.valueMin"),
		valueMax: joi.number().label("validator.metrics.valueMax"),
		takenAtMin: joi.date().iso().label("validator.metrics.takenAtMin"),
		takenAtMax: joi.date().iso().label("validator.metrics.takenAtMax"),
		takenAtOffset: joi.number().label("validator.metrics.takenAtOffset"),
		recordedAtMin: joi.date().iso().label("validator.metrics.recordedAtMin"),
		recordedAtMax: joi.date().iso().label("validator.metrics.recordedAtMax"),
		page: joi.number().positive().label("validator.common.page"),
		limit: joi.number().positive().label("validator.common.limit"),
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
			.label("validator.common.sort"),
		sortBy: joi.string().valid("row", "column").label("validator.common.sortBy"),
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
			.label("validator.metrics.column"),
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
			.label("validator.metrics.row"),
		columnAggregation: joi
			.string()
			.valid("1m", "5m", "30m", "1h", "4h", "6h", "12h", "1d", "7d", "15d", "30d", "60d")
			.label("validator.metrics.columnAggregation"),
		rowAggregation: joi
			.string()
			.valid("avg", "min", "max", "sum", "count", "stddev_pop")
			.label("validator.metrics.rowAggregation"),
		nextToken: joi.string().label("validator.metrics.nextToken"),
	}),
});

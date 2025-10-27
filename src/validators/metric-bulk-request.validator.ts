import { joi } from "@structured-growth/microservice-sdk";

const isoFormatWithTimezone = /^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}[+-][0-9]{2}:00$/;

export const MetricBulkRequestValidator = joi.object({
	query: joi.object(),
	body: joi
		.array()
		.items(
			joi.alternatives().try(
				joi.object({
					op: joi.string().valid("create").required(),
					data: joi
						.object({
							id: joi
								.string()
								.uuid({ version: ["uuidv3", "uuidv4"] })
								.label("validator.common.id"),
							orgId: joi.number().positive().required().label("validator.metrics.orgId"),
							region: joi.string().min(2).required().label("validator.metrics.region"),
							accountId: joi.number().positive().label("validator.metrics.accountId"),
							userId: joi.number().positive().required().label("validator.metrics.userId"),
							metricCategoryId: joi.number().positive().label("validator.metrics.metricCategoryId"),
							metricTypeId: joi.number().positive().label("validator.metrics.metricTypeId"),
							metricTypeCode: joi.string().max(50).label("validator.metrics.metricTypeCode"),
							metricTypeVersion: joi.number().positive().required().label("validator.metrics.metricTypeVersion"),
							relatedToRn: joi.string().max(50).label("validator.metrics.relatedToRn"),
							deviceId: joi.number().positive().label("validator.common.deviceId"),
							batchId: joi.string().max(50).required().label("validator.metrics.batchId"),
							value: joi.number().required().label("validator.metrics.value"),
							takenAt: joi.string().regex(isoFormatWithTimezone).required().label("validator.metrics.takenAt"),
							takenAtOffset: joi.number().label("validator.metrics.takenAtOffset"),
							metadata: joi
								.object()
								.max(10)
								.pattern(
									/^/,
									joi
										.alternatives()
										.try(joi.boolean(), joi.number(), joi.string().max(255), joi.string().isoDate())
										.allow("", null)
								),
						})
						.xor("metricTypeId", "metricTypeCode")
						.required(),
				}),
				joi.object({
					op: joi.string().valid("update").required(),
					data: joi
						.object({
							id: joi.string().uuid().required(),
							value: joi.number().label("Value"),
							takenAt: joi.string().regex(isoFormatWithTimezone).label("validator.metrics.takenAt"),
							metricTypeCode: joi.string().max(50).label("validator.metrics.metricTypeCode"),
							metricTypeVersion: joi.number().positive().label("validator.metrics.metricTypeVersion"),
							metadata: joi
								.object()
								.max(10)
								.pattern(
									/^/,
									joi
										.alternatives()
										.try(joi.boolean(), joi.number(), joi.string().max(255), joi.string().isoDate())
										.allow("", null)
								),
						})
						.with("metricTypeCode", "metricTypeVersion")
						.with("metricTypeVersion", "metricTypeCode"),
				}),
				joi.object({
					op: joi.string().valid("upsert").required(),
					data: joi
						.object({
							id: joi
								.string()
								.uuid({ version: ["uuidv3", "uuidv4"] })
								.label("validator.common.id"),
							orgId: joi.number().positive().required().label("validator.metrics.orgId"),
							region: joi.string().min(2).required().label("validator.metrics.region"),
							accountId: joi.number().positive().label("validator.metrics.accountId"),
							userId: joi.number().positive().required().label("validator.metrics.userId"),
							metricCategoryId: joi.number().positive().label("validator.metrics.metricCategoryId"),
							metricTypeId: joi.number().positive().label("validator.metrics.metricTypeId"),
							metricTypeCode: joi.string().max(50).label("validator.metrics.metricTypeCode"),
							metricTypeVersion: joi.number().positive().required().label("validator.metrics.metricTypeVersion"),
							relatedToRn: joi.string().max(50).label("validator.metrics.relatedToRn"),
							deviceId: joi.number().positive().label("validator.metrics.deviceId"),
							batchId: joi.string().max(50).required().label("validator.metrics.batchId"),
							value: joi.number().required().label("validator.metrics.value"),
							takenAt: joi.string().regex(isoFormatWithTimezone).required().label("validator.metrics.takenAt"),
							takenAtOffset: joi.number().label("validator.metrics.takenAtOffset"),
							metadata: joi
								.object()
								.max(10)
								.pattern(
									/^/,
									joi
										.alternatives()
										.try(joi.boolean(), joi.number(), joi.string().max(255), joi.string().isoDate())
										.allow("", null)
								),
						})
						.xor("metricTypeId", "metricTypeCode")
						.required(),
				}),
				joi.object({
					op: joi.string().valid("delete").required(),
					data: joi
						.object({
							id: joi.string().uuid().required(),
						})
						.required(),
				})
			)
		)
		// .min(1)
		.required(),
});

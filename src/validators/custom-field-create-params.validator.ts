import { joi } from "@structured-growth/microservice-sdk";

export const CustomFieldCreateParamsValidator = joi.object({
	query: joi.object(),
	body: joi.object({
		orgId: joi.number().positive().required().label("validator.customFields.orgId"),
		region: joi.string().required().min(2).max(10).label("validator.customFields.region"),
		entity: joi.string().required().max(255).label("validator.customFields.entity"),
		title: joi.string().required().max(255).label("validator.customFields.title"),
		name: joi.string().required().max(255).label("validator.customFields.name"),
		schema: joi.object().required().label("validator.customFields.schema"),
		status: joi.string().valid("active", "inactive").label("validator.customFields.status"),
	}),
});

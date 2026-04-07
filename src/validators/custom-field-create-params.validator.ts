import { joi } from "@structured-growth/microservice-sdk";

export const CustomFieldCreateParamsValidator = joi.object({
	query: joi.object(),
	body: joi.object({
		orgId: joi.number().positive().required().label("validator.customFields.orgId"),
		entity: joi.string().required().max(255).label("validator.customFields.entity"),
		title: joi.string().required().max(255).label("validator.customFields.title"),
		name: joi
			.string()
			.pattern(/^[a-zA-Z0-9_-]+$/)
			.max(255)
			.required()
			.label("validator.customFields.name"),
		schema: joi.object().required().label("validator.customFields.schema"),
		status: joi.string().valid("active", "inactive").label("validator.customFields.status"),
	}),
});

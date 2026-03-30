import { joi } from "@structured-growth/microservice-sdk";

export const CustomFieldUpdateParamsValidator = joi.object({
	customFieldId: joi.number().positive().required().label("validator.customFields.customFieldId"),
	query: joi.object(),
	body: joi.object({
		entity: joi.string().max(255).label("validator.customFields.entity"),
		title: joi.string().max(255).label("validator.customFields.title"),
		name: joi.string().max(255).label("validator.customFields.name"),
		schema: joi.object().label("validator.customFields.schema"),
		status: joi.string().valid("active", "inactive", "archived").label("validator.customFields.status"),
	}),
});

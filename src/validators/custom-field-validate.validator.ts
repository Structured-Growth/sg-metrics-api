import { joi } from "@structured-growth/microservice-sdk";

export const CustomFieldValidateValidator = joi.object({
	body: joi.object({
		entity: joi.string().required().label("validator.customFields.entity"),
		orgId: joi.number().positive().required().label("validator.customFields.orgId"),
		data: joi.object().required().label("validator.common.metadata"),
	}),
	query: joi.object(),
});

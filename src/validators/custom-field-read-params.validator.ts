import { joi } from "@structured-growth/microservice-sdk";

export const CustomFieldReadParamsValidator = joi.object({
	customFieldId: joi.number().positive().required().label("validator.customFields.customFieldId"),
});

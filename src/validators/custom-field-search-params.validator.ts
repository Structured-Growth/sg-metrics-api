import { joi } from "@structured-growth/microservice-sdk";
import { CommonSearchParamsValidator } from "./common-search-params.validator";

export const CustomFieldSearchParamsValidator = joi.object({
	query: joi
		.object({
			orgId: joi.number().positive().required().label("validator.customFields.orgId"),
			entity: joi.array().items(joi.string().max(255)).label("validator.customFields.entity"),
			status: joi
				.array()
				.items(joi.string().valid("active", "inactive", "archived"))
				.label("validator.customFields.status"),
			title: joi.array().items(joi.string().max(255)).label("validator.customFields.title"),
			name: joi.array().items(joi.string().max(255)).label("validator.customFields.name"),
			includeInherited: joi.boolean().label("validator.customFields.includeInherited"),
		})
		.concat(CommonSearchParamsValidator),
});

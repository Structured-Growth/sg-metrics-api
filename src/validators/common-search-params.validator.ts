import { joi } from "@structured-growth/microservice-sdk";

export const CommonSearchParamsValidator = joi.object({
	id: joi.array().items(joi.number().positive().required()).label("validator.common.id"),
	arn: joi.array().items(joi.string().required()).label("validator.common.arn"),
	page: joi.number().positive().label("validator.common.page"),
	limit: joi.number().positive().label("validator.common.limit"),
	sort: joi.array().items(joi.string().required()).label("validator.common.sort"),
});

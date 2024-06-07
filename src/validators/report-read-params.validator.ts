import { joi } from "@structured-growth/microservice-sdk";

export const ReportReadParamsValidator = joi.object({
	reportId: joi.number().positive().required().label("Report Id"),
});
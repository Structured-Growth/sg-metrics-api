import { DefaultSearchParamsInterface } from "@structured-growth/microservice-sdk";
import { CustomFieldAttributes } from "../../database/models/custom-field.sequelize";

export interface CustomFieldSearchParamsInterface extends Omit<DefaultSearchParamsInterface, "accountId"> {
	entity?: string[];
	status?: CustomFieldAttributes["status"][];
	title?: string[];
	name?: string[];
	includeInherited?: boolean;
}

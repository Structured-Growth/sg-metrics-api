import { CustomFieldAttributes } from "../../database/models/custom-field.sequelize";

export interface CustomFieldUpdateBodyInterface {
	entity?: string;
	title?: string;
	name?: string;
	schema?: Record<string, unknown>;
	status?: CustomFieldAttributes["status"];
}

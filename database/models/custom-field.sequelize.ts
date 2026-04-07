import { Column, DataType, Model, Table } from "sequelize-typescript";
import { container, DefaultModelInterface, RegionEnum } from "@structured-growth/microservice-sdk";

export interface CustomFieldAttributes extends Omit<DefaultModelInterface, "accountId"> {
	entity: string;
	title: string;
	name: string;
	schema: Record<string, unknown>;
	status: "active" | "inactive" | "archived";
}

export interface CustomFieldCreationAttributes
	extends Omit<CustomFieldAttributes, "id" | "arn" | "createdAt" | "updatedAt" | "deletedAt"> {}

export interface CustomFieldUpdateAttributes
	extends Partial<Pick<CustomFieldCreationAttributes, "entity" | "title" | "name" | "schema" | "status">> {}

@Table({
	tableName: "custom_fields",
	timestamps: true,
	underscored: true,
	paranoid: true,
})
export class CustomField
	extends Model<CustomFieldAttributes, CustomFieldCreationAttributes>
	implements CustomFieldAttributes
{
	@Column
	orgId: number;

	@Column(DataType.STRING)
	region: RegionEnum;

	@Column(DataType.STRING)
	entity: string;

	@Column(DataType.STRING)
	title: string;

	@Column(DataType.STRING)
	name: string;

	@Column(DataType.JSONB)
	schema: Record<string, unknown>;

	@Column(DataType.STRING)
	status: CustomFieldAttributes["status"];

	static get arnPattern(): string {
		return [container.resolve("appPrefix"), "<region>", "<orgId>", "-", "custom-fields/<customFieldId>"].join(":");
	}

	get arn(): string {
		return [container.resolve("appPrefix"), this.region, this.orgId, "-", `custom-fields/${this.id}`].join(":");
	}
}

export default CustomField;

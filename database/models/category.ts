import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from "sequelize-typescript";
import {
	container,
	RegionEnum,
	DefaultModelInterface,
	BelongsToOrgInterface,
	BelongsToAccountInterface,
} from "@structured-growth/microservice-sdk";

export interface CategoryAttributes
	extends DefaultModelInterface {
	catId?: number | any;
	orgId: number;
	region: RegionEnum;
	title: string;
	code: number;
	status: "active" | "inactive" | "archived";
}

export interface CategoryCreationAttributes
	extends Omit<CategoryAttributes, "catId" | "arn" | "createdAt" | "updatedAt" | "deletedAt"> {}

export interface OrganizationUpdateAttributes
	extends Pick<CategoryAttributes, "title"  |  "status"> {}

@Table({
	tableName: "categories",
	timestamps: true,
	underscored: true,
})
export class Category
	extends Model<CategoryAttributes, CategoryCreationAttributes>
	implements CategoryAttributes
{
	@Column
	catId: number;

	@Column
	orgId: number;

	@Column(DataType.STRING)
	region: RegionEnum;

	@Column
	title: string;

	@Column
	code: number;

	@Column(DataType.STRING)
	status: CategoryAttributes["status"];

	static get arnPattern(): string {
		return [container.resolve("appPrefix"), "<region>", "<orgId>"].join(":");
	}

	get arn(): string {
		return [container.resolve("appPrefix"), this.region, this.orgId, this.catId].join(":");
	}
}

export default Category;

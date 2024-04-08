import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from "sequelize-typescript";
import {
	container,
	RegionEnum,
	DefaultModelInterface,
	BelongsToOrgInterface,
} from "@structured-growth/microservice-sdk";

export interface MetricCategoryAttributes
	extends Omit<DefaultModelInterface, 'accountId'> {
	id?: number | any;
	orgId: number;
	accountId?: number;
	region: RegionEnum;
	title: string;
	code: number;
	status: "active" | "inactive" | "archived";
}

export interface MetricCategoryCreationAttributes
	extends Omit<MetricCategoryAttributes, "id" | "arn" | "createdAt" | "updatedAt" | "deletedAt"> {}

export interface MetricCategoryUpdateAttributes
	extends Pick<MetricCategoryAttributes, "title"  |  "status"> {}

@Table({
	tableName: "categories",
	timestamps: true,
	underscored: true,
})
export class MetricCategory
	extends Model<MetricCategoryAttributes, MetricCategoryCreationAttributes>
	implements MetricCategoryAttributes
{
	@Column
	id: number;

	@Column
	orgId: number;

	@Column
	accountId: number;

	@Column(DataType.STRING)
	region: RegionEnum;

	@Column
	title: string;

	@Column
	code: number;

	@Column(DataType.STRING)
	status: MetricCategoryAttributes["status"];

	static get arnPattern(): string {
		return [container.resolve("appPrefix"), "<region>", "<orgId>", '<accountId>'].join(":");
	}

	get arn(): string {
		return [container.resolve("appPrefix"), this.region, this.orgId, this.accountId, this.id].join(":");
	}
}

export default MetricCategory;

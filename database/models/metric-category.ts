import { Column, DataType, Model, Table } from "sequelize-typescript";
import {
	container,
	RegionEnum,
	DefaultModelInterface,
} from "@structured-growth/microservice-sdk";

export interface MetricCategoryAttributes
	extends Omit<DefaultModelInterface, 'accountId'> {
	id?: number | any;
	orgId: number;
	accountId?: number;
	region: RegionEnum;
	title: string;
	code: string;
	status: "active" | "inactive" | "archived";
}

export interface MetricCategoryCreationAttributes
	extends Omit<MetricCategoryAttributes, "id" | "arn" | "createdAt" | "updatedAt" | "deletedAt"> {}

export interface MetricCategoryUpdateAttributes
	extends Pick<MetricCategoryAttributes, "title"  | "code" | "status"> {}

@Table({
	tableName: "metric_categories",
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
	code: string;

	@Column(DataType.STRING)
	status: MetricCategoryAttributes["status"];

	static get arnPattern(): string {
		return [container.resolve("appPrefix"), "<region>", "<orgId>", '<accountId>', "metric-category/<metricCategoryId>"].join(":");
	}

	get arn(): string {
		return [container.resolve("appPrefix"), this.region, this.orgId, this.accountId || '-', `metric-category/${this.id}`].join(":");
	}
}

export default MetricCategory;

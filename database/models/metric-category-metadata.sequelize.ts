import { BelongsTo, Column, DataType, ForeignKey, Model, PrimaryKey, Table } from "sequelize-typescript";
import {
	container,
	RegionEnum,
	DefaultModelInterface,
	BelongsToOrgInterface,
} from "@structured-growth/microservice-sdk";
import MetricCategory from "./metric-category.sequelize";

export interface MetricCategoryMetadataAttributes
	extends Omit<DefaultModelInterface, 'accountId'> {
	orgId: number;
	accountId?: number;
	metricCategoryId: number;
	name: string;
	value: string;
}

export interface MetricCategoryMetadataCreationAttributes
	extends Omit<MetricCategoryMetadataAttributes, "id" | "arn" | "createdAt" | "updatedAt" | "deletedAt"> {}

export interface MetricCategoryUpdateAttributes
	extends Pick<MetricCategoryMetadataAttributes, "name"  |  "value"> {}

@Table({
	tableName: "metric_category_metadata",
	timestamps: true,
	underscored: true,
})
export class MetricCategoryMetadata
	extends Model<MetricCategoryMetadataAttributes, MetricCategoryMetadataCreationAttributes>
	implements MetricCategoryMetadataAttributes
{

	@Column
	orgId: number;

	@Column
	accountId: number;

	@Column
	@ForeignKey(() => MetricCategory)
	metricCategoryId: number;

	@BelongsTo(() => MetricCategory)
	metricCategory: MetricCategory;

	@Column(DataType.STRING)
	region: RegionEnum;

	@Column
	name: string;

	@Column
	value: string;

	static get arnPattern(): string {
		return [container.resolve("appPrefix"), "<region>", "<orgId>", '<accountId>', "metric-category/<metricCategoryId>",  "metadata/<metricCategoryMetadataId>"].join(":");
	}

	get arn(): string {
		return [container.resolve("appPrefix"), this.region, this.orgId, this.accountId || '-', `metric-category/${this.metricCategoryId}`,  `metadata/${this.id}`].join(":");
	}
}

export default MetricCategoryMetadata;

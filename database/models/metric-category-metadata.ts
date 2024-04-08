import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from "sequelize-typescript";
import {
	container,
	RegionEnum,
	DefaultModelInterface,
	BelongsToOrgInterface,
} from "@structured-growth/microservice-sdk";
import MetricCategory from "./metric-category";

export interface MetricCategoryMetadataAttributes
	extends Omit<DefaultModelInterface, 'accountId'> {
	id?: number | any;
	orgId: number;
	accountId?: number;
	metricCategoryId: number;
	name: string;
	value: number;

}

export interface MetricCategoryMetadataCreationAttributes
	extends Omit<MetricCategoryMetadataAttributes, "id" | "arn" | "createdAt" | "updatedAt" | "deletedAt"> {}

export interface MetricCategoryUpdateAttributes
	extends Pick<MetricCategoryMetadataAttributes, "name"  |  "value"> {}

@Table({
	tableName: "metric-categories-metadata",
	timestamps: true,
	underscored: true,
})
export class MetricCategoryMetadata
	extends Model<MetricCategoryMetadataAttributes, MetricCategoryMetadataCreationAttributes>
	implements MetricCategoryMetadataAttributes
{
	@Column
	id: number;

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
	value: number;


	static get arnPattern(): string {
		return [container.resolve("appPrefix"), "<region>", "<orgId>", '<accountId>'].join(":");
	}

	get arn(): string {
		return [container.resolve("appPrefix"), this.region, this.orgId, this.accountId, this.metricCategoryId, this.id].join(":");
	}
}

export default MetricCategoryMetadata;

import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from "sequelize-typescript";
import {
	container,
	RegionEnum,
	DefaultModelInterface,
	BelongsToOrgInterface,
} from "@structured-growth/microservice-sdk";
import MetricCategory from "./metric-category.sequelize";
import MetricType from "./metric-type.sequelize";
import {MetricCategoryMetadataAttributes} from "./metric-category-metadata.sequelize";

export interface MetricTypeMetadataAttributes
	extends Omit<DefaultModelInterface, 'accountId'> {
	orgId: number;
	accountId?: number;
	metricCategoryId: number;
	metricTypeId: number;
	name: string;
	value: string;
}

export interface MetricTypeMetadataCreationAttributes
	extends Omit<MetricTypeMetadataAttributes, "id" | "arn" | "createdAt" | "updatedAt" | "deletedAt"> {}

export interface MetricTypeMetadataUpdateAttributes
	extends Pick<MetricTypeMetadataAttributes, "name"  |  "value"> {}

@Table({
	tableName: "metric_types_metadata",
	timestamps: true,
	underscored: true,
})
export class MetricTypeMetadata
	extends Model<MetricTypeMetadataAttributes, MetricTypeMetadataCreationAttributes>
	implements MetricTypeMetadataAttributes
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

	@Column
	@ForeignKey(() => MetricType)
	metricTypeId: number;

	@BelongsTo(() => MetricType)
	metricType: MetricType;

	@Column(DataType.STRING)
	region: RegionEnum;

	@Column
	name: string;

	@Column
	value: string;

	static get arnPattern(): string {
		return [container.resolve("appPrefix"), "<region>", "<orgId>", '<accountId>', "metric-categories/<metricCategoryId>/metric-types/<metricTypeId>/metadata/<metricTypeMetadataId>"].join(":");
	}

	get arn(): string {
		return [container.resolve("appPrefix"), this.region, this.orgId, this.accountId || '-', `metric-categories/${this.metricCategoryId}/metric-types/${this.metricTypeId}/metadata/${this.id}`].join(":");
	}
}

export default MetricTypeMetadata;

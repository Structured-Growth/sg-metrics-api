import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from "sequelize-typescript";
import {
	container,
	RegionEnum,
	DefaultModelInterface,
	BelongsToOrgInterface,
} from "@structured-growth/microservice-sdk";
import MetricCategory from "./metric-category";
import MetricType from "./metric-type";

export interface MetricTypeMetadataAttributes
	extends Omit<DefaultModelInterface, 'accountId'> {
	id?: number | any;
	orgId: number;
	accountId?: number;
	metricCategoryId: number;
	metricTypeId: number;
	name: string;
	value: number;

}

export interface MetricTypeMetadataCreationAttributes
	extends Omit<MetricTypeMetadataAttributes, "id" | "arn" | "createdAt" | "updatedAt" | "deletedAt"> {}

export interface MetricTypeUpdateAttributes
	extends Pick<MetricTypeMetadataAttributes, "name"  |  "value"> {}

@Table({
	tableName: "metric-types-metadata",
	timestamps: true,
	underscored: true,
})
export class MetricTypeMetadata
	extends Model<MetricTypeMetadataAttributes, MetricTypeMetadataCreationAttributes>
	implements MetricTypeMetadataAttributes
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
	value: number;


	static get arnPattern(): string {
		return [container.resolve("appPrefix"), "<region>", "<orgId>", '<accountId>'].join(":");
	}

	get arn(): string {
		return [container.resolve("appPrefix"), this.region, this.orgId, this.accountId, this.metricCategoryId, this.metricTypeId, this.id].join(":");
	}
}

export default MetricTypeMetadata;

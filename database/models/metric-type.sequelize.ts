import { BelongsTo, Column, DataType, ForeignKey, HasMany, Model, Table } from "sequelize-typescript";
import { container, RegionEnum, DefaultModelInterface } from "@structured-growth/microservice-sdk";
import MetricCategory from "./metric-category.sequelize";
import MetricTypeMetadata from "./metric-type-metadata.sequelize";

export interface MetricTypeAttributes extends Omit<DefaultModelInterface, "accountId"> {
	id?: number | any;
	orgId: number;
	accountId?: number;
	region: RegionEnum;
	metricCategoryId: number;
	title: string;
	code: string;
	unit: string;
	factor: number;
	relatedTo: string;
	version: number;
	status: "active" | "inactive" | "archived";
}

export interface MetricTypeCreationAttributes
	extends Omit<MetricTypeAttributes, "id" | "arn" | "createdAt" | "updatedAt" | "deletedAt"> {}

export interface MetricTypeUpdateAttributes
	extends Pick<MetricTypeAttributes, "title" | "code" | "factor" | "version" | "status"> {}

@Table({
	tableName: "metric_types",
	timestamps: true,
	underscored: true,
})
export class MetricType
	extends Model<MetricTypeAttributes, MetricTypeCreationAttributes>
	implements MetricTypeAttributes
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
	title: string;

	@Column
	code: string;

	@Column
	unit: string;

	@Column
	factor: number;

	@Column
	relatedTo: string;

	@Column
	version: number;

	@Column(DataType.STRING)
	status: MetricTypeAttributes["status"];

	@HasMany(() => MetricTypeMetadata, { foreignKey: "metricTypeId" })
	metadata: Record<string, string>;

	static get arnPattern(): string {
		return [
			container.resolve("appPrefix"),
			"<region>",
			"<orgId>",
			"<accountId>",
			"metric-category/<metricCategoryId>/metric-type/<metricTypeId>",
		].join(":");
	}

	get arn(): string {
		return [
			container.resolve("appPrefix"),
			this.region,
			this.orgId,
			this.accountId || "-",
			`metric-category/${this.metricCategoryId}/metric-type/${this.id}`,
		].join(":");
	}
}

export default MetricType;

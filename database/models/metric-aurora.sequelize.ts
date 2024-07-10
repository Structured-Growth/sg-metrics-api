import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from "sequelize-typescript";
import { container, DefaultModelInterface } from "@structured-growth/microservice-sdk";
import { RegionEnum } from "@structured-growth/microservice-sdk/.dist";
import MetricCategory from "./metric-category.sequelize";
import MetricType from "./metric-type.sequelize";

export interface MetricAuroraAttributes extends Omit<DefaultModelInterface, "accountId" | "deletedAt"> {
	accountId?: number;
	userId?: number;
	relatedToRn?: string;
	metricCategoryId: number;
	metricTypeId: number;
	metricTypeVersion: number;
	deviceId: number;
	batchId: string;
	value: number;
	takenAt: Date;
	takenAtOffset: number;
	recordedAt: Date;
	isDeleted: boolean;
}

export interface MetricAuroraCreationAttributes
	extends Omit<MetricAuroraAttributes, "arn" | "createdAt" | "updatedAt"> {}

export interface MetricAuroraUpdateAttributes extends Pick<MetricAuroraAttributes, "value" | "takenAt"> {}

@Table({
	tableName: "metrics_aurora",
	timestamps: true,
	underscored: true,
})
export class MetricAurora
	extends Model<MetricAuroraAttributes, MetricAuroraCreationAttributes>
	implements MetricAuroraAttributes
{
	@Column
	id: string;

	@Column
	orgId: number;

	@Column(DataType.STRING)
	region: RegionEnum;

	@Column
	accountId: number;

	@Column
	userId: number;

	@Column
	relatedToRn: string;

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

	@Column
	metricTypeVersion: number;

	@Column
	deviceId: number;

	@Column
	batchId: string;

	@Column({
		type: DataType.FLOAT,
	})
	value: number;

	@Column
	takenAt: Date;

	@Column
	takenAtOffset: number;

	@Column({
		type: DataType.DATE,
		defaultValue: DataType.NOW,
	})
	recordedAt: Date;

	@Column
	isDeleted: boolean;

	static get arnPattern(): string {
		return [
			container.resolve("appPrefix"),
			"<region>",
			"<orgId>",
			"<accountId>",
			"/metric-category/<metricCategoryId>",
			"/metric-type/<metricTypeId>",
			"/metric-aurora/<metricId>",
		].join(":");
	}

	get arn(): string {
		return [
			container.resolve("appPrefix"),
			this.region,
			this.orgId,
			this.accountId || "-",
			`/metric-category/${this.metricCategoryId}`,
			`/metric-type/${this.metricTypeId}`,
			`/metric-aurora/${this.id}`,
		].join(":");
	}
}

export default MetricAurora;

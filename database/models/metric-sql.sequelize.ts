import { Column, DataType, Model, PrimaryKey, Table } from "sequelize-typescript";
import { container, DefaultModelInterface } from "@structured-growth/microservice-sdk";
import { RegionEnum } from "@structured-growth/microservice-sdk";
import { MetricAttributes, MetricCreationAttributes } from "./metric";

@Table({
	tableName: "metrics",
	underscored: true,
	timestamps: false,
})
export class MetricSQL extends Model<MetricAttributes, MetricCreationAttributes> implements MetricAttributes {
	@PrimaryKey
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
	metricCategoryId: number;

	@Column
	metricTypeId: number;

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
			"metric-category/<metricCategoryId>/metric-type/<metricTypeId>/metric/<metricId>",
		].join(":");
	}

	get arn(): string {
		return [
			container.resolve("appPrefix"),
			this.region,
			this.orgId,
			this.accountId || "-",
			`metric-category/${this.metricCategoryId}/metric-type/${this.metricTypeId}/metric/${this.id}`,
		].join(":");
	}
}

export default MetricSQL;

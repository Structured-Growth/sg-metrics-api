import { Column, DataType, Model, Table } from "sequelize-typescript";
import { container, RegionEnum, DefaultModelInterface } from "@structured-growth/microservice-sdk";

export interface ReportAttributes extends DefaultModelInterface {
	title: string;
	inDashboard: boolean;
	reportParameters: string;
}

export interface ReportCreationAttributes
	extends Omit<ReportAttributes, "id" | "arn" | "createdAt" | "updatedAt" | "deletedAt"> {}

export interface ReportUpdateAttributes
	extends Partial<Pick<ReportAttributes, "title" | "inDashboard" | "reportParameters">> {}

@Table({
	tableName: "reports",
	timestamps: true,
	underscored: true,
	paranoid: false,
})
export class ReportSequelize extends Model<ReportAttributes, ReportCreationAttributes> implements ReportAttributes {
	@Column
	orgId: number;

	@Column(DataType.STRING)
	region: RegionEnum;

	@Column
	accountId: number;

	@Column
	title: string;

	@Column
	inDashboard: boolean;

	@Column
	reportParameters: string;

	static get arnPattern(): string {
		return [container.resolve("appPrefix"), "<region>", "<orgId>", "<accountId>", "reports/<reportId>"].join(":");
	}

	get arn(): string {
		return [container.resolve("appPrefix"), this.region, this.orgId, this.accountId, `reports/${this.id}`].join(":");
	}

}

export default ReportSequelize;
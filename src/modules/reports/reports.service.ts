import { autoInjectable, inject, ValidationError } from "@structured-growth/microservice-sdk";
import ReportSequelize from "../../../database/models/report.sequelize";
import { ReportCreateBodyInterface } from "../../interfaces/report-create-body.interface";
import { ReportsRepository } from "./reports.repository";

@autoInjectable()
export class ReportsService {
	constructor(
		@inject("ReportsRepository") private reportRepository: ReportsRepository,
	) {}

	public async create(params: ReportCreateBodyInterface): Promise<ReportSequelize> {
		const { title } = params;

		const [countResult]: { count: number }[] = await ReportSequelize.count({
			where: { title },
			group: [],
		});

		const count = countResult?.count || 0;

		if (count > 0) {
			throw new ValidationError({
				clientName: "Report with the same title is already exist",
			});
		}

		return this.reportRepository.create({
			orgId: params.orgId,
			region: params.region,
			accountId: params.accountId,
			title: params.title,
			inDashboard: params.inDashboard,
			reportParameters: params.reportParameters,
		});
	}
}
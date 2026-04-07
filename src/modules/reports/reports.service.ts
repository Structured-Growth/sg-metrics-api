import { autoInjectable, I18nType, inject, NotFoundError } from "@structured-growth/microservice-sdk";
import ReportSequelize, {
	ReportCreationAttributes,
	ReportUpdateAttributes,
} from "../../../database/models/report.sequelize";
import { ReportCreateBodyInterface } from "../../interfaces/report-create-body.interface";
import { ReportUpdateBodyInterface } from "../../interfaces/report-update-body.interface";
import { CustomFieldService } from "../custom-fields/custom-field.service";
import { ReportsRepository } from "./reports.repository";

@autoInjectable()
export class ReportsService {
	private i18n: I18nType;

	constructor(
		@inject("ReportsRepository") private reportRepository: ReportsRepository,
		@inject("CustomFieldService") private customFieldService: CustomFieldService,
		@inject("i18n") private getI18n: () => I18nType
	) {
		this.i18n = this.getI18n();
	}

	public async create(params: ReportCreateBodyInterface, parentOrgIds: number[] = []): Promise<ReportSequelize> {
		await this.customFieldService.validate("Report", params.metadata, [params.orgId, ...parentOrgIds]);

		return this.reportRepository.create({
			...params,
			metadata: params.metadata ?? {},
		} as ReportCreationAttributes);
	}

	public async update(
		id: number,
		params: ReportUpdateBodyInterface,
		parentOrgIds: number[] = []
	): Promise<ReportSequelize> {
		const report = await this.reportRepository.read(id);

		if (!report) {
			throw new NotFoundError(`${this.i18n.__("error.report.name")} ${id} ${this.i18n.__("error.common.not_found")}`);
		}

		await this.customFieldService.validate(
			"Report",
			params.metadata !== undefined ? params.metadata : report.metadata,
			[report.orgId, ...parentOrgIds]
		);

		return this.reportRepository.update(id, params as ReportUpdateAttributes);
	}
}

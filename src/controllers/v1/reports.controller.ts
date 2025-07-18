import { Get, Route, Tags, Queries, OperationId, SuccessResponse, Body, Post, Path, Put, Delete } from "tsoa";
import {
	autoInjectable,
	BaseController,
	DescribeAction,
	DescribeResource,
	inject,
	NotFoundError,
	SearchResultInterface,
	ValidateFuncArgs,
	I18nType,
} from "@structured-growth/microservice-sdk";
import { pick } from "lodash";
import { ReportAttributes } from "../../../database/models/report.sequelize";
import { ReportsRepository } from "../../modules/reports/reports.repository";
import { ReportsService } from "../../modules/reports/reports.service";
import { ReportCreateBodyInterface } from "../../interfaces/report-create-body.interface";
import { ReportSearchParamsInterface } from "../../interfaces/report-search-params.interface";
import { ReportUpdateBodyInterface } from "../../interfaces/report-update-body.interface";
import { ReportSearchParamsValidator } from "../../validators/report-search-params.validator";
import { ReportCreateParamsValidator } from "../../validators/report-create-params.validator";
import { ReportReadParamsValidator } from "../../validators/report-read-params.validator";
import { ReportUpdateParamsValidator } from "../../validators/report-update-params.validator";
import { ReportDeleteParamsValidator } from "../../validators/report-delete-params.validator";

const publicReportAttributes = [
	"id",
	"orgId",
	"region",
	"accountId",
	"createdAt",
	"updatedAt",
	"arn",
	"title",
	"inDashboard",
	"reportParameters",
] as const;
type ReportKeys = (typeof publicReportAttributes)[number];
type PublicReportAttributes = Pick<ReportAttributes, ReportKeys>;

@Route("v1/reports")
@Tags("Reports")
@autoInjectable()
export class ReportsController extends BaseController {
	private i18n: I18nType;
	constructor(
		@inject("ReportsRepository") private reportsRepository: ReportsRepository,
		@inject("i18n") private getI18n: () => I18nType
	) {
		super();
		this.i18n = this.getI18n();
	}

	/**
	 * Search Reports
	 */
	@OperationId("Search")
	@Get("/")
	@SuccessResponse(200, "Returns list of reports")
	@DescribeAction("reports/search")
	@DescribeResource("Organization", ({ query }) => Number(query.orgId))
	@DescribeResource("Account", ({ query }) => Number(query.accountId))
	@DescribeResource("Report", ({ query }) => query.id?.map(Number))
	@ValidateFuncArgs(ReportSearchParamsValidator)
	async search(@Queries() query: ReportSearchParamsInterface): Promise<SearchResultInterface<PublicReportAttributes>> {
		const { data, ...result } = await this.reportsRepository.search(query);

		return {
			data: data.map((report) => ({
				...(pick(report.toJSON(), publicReportAttributes) as PublicReportAttributes),
				arn: report.arn,
			})),
			...result,
		};
	}

	/**
	 * Create Report.
	 */
	@OperationId("Create")
	@Post("/")
	@SuccessResponse(201, "Returns created report")
	@DescribeAction("reports/create")
	@ValidateFuncArgs(ReportCreateParamsValidator)
	@DescribeResource("Organization", ({ body }) => Number(body.orgId))
	@DescribeResource("Account", ({ body }) => Number(body.accountId))
	async create(@Queries() query: {}, @Body() body: ReportCreateBodyInterface): Promise<PublicReportAttributes> {
		const report = await this.reportsRepository.create(body);
		this.response.status(201);

		return {
			...(pick(report.toJSON(), publicReportAttributes) as PublicReportAttributes),
			arn: report.arn,
		};
	}

	/**
	 * Get Report
	 */
	@OperationId("Read")
	@Get("/:reportId")
	@SuccessResponse(200, "Returns report")
	@DescribeAction("reports/read")
	@DescribeResource("Report", ({ params }) => Number(params.reportId))
	@ValidateFuncArgs(ReportReadParamsValidator)
	async get(@Path() reportId: number): Promise<PublicReportAttributes> {
		const report = await this.reportsRepository.read(reportId);

		if (!report) {
			throw new NotFoundError(
				`${this.i18n.__("error.report.name")} ${report} ${this.i18n.__("error.common.not_found")}`
			);
		}

		return {
			...(pick(report.toJSON(), publicReportAttributes) as PublicReportAttributes),
			arn: report.arn,
		};
	}

	/**
	 * Update Report
	 */
	@OperationId("Update")
	@Put("/:reportId")
	@SuccessResponse(200, "Returns updated report")
	@DescribeAction("reports/update")
	@DescribeResource("Report", ({ params }) => Number(params.reportId))
	@ValidateFuncArgs(ReportUpdateParamsValidator)
	async update(
		@Path() reportId: number,
		@Queries() query: {},
		@Body() body: ReportUpdateBodyInterface
	): Promise<PublicReportAttributes> {
		const report = await this.reportsRepository.update(reportId, body);

		return {
			...(pick(report.toJSON(), publicReportAttributes) as PublicReportAttributes),
			arn: report.arn,
		};
	}

	/**
	 * Mark Report as deleted. Will be permanently deleted in 90 days.
	 */
	@OperationId("Delete")
	@Delete("/:reportId")
	@SuccessResponse(204, "Returns nothing")
	@DescribeAction("reports/delete")
	@DescribeResource("Report", ({ params }) => Number(params.reportId))
	@ValidateFuncArgs(ReportDeleteParamsValidator)
	async delete(@Path() reportId: number): Promise<void> {
		await this.reportsRepository.delete(reportId);
		this.response.status(204);
	}
}

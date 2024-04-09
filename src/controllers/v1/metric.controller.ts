import { Get, Route, Tags, Queries, OperationId, SuccessResponse, Body, Post, Path, Put, Delete } from "tsoa";
import {
	autoInjectable,
	BaseController,
	DescribeAction,
	DescribeResource,
	container,
	inject,
	NotFoundError,
	ValidateFuncArgs,
	SearchResultInterface,
} from "@structured-growth/microservice-sdk";
import { Metric, MetricAttributes } from '../../../database/models/metric';
import { MetricSearchParamsInterface } from "../../interfaces/metric-search-params.interface";
import { MetricCreateBodyInterface } from "../../interfaces/metric-create-body.interface";
import { MetricUpdateBodyInterface } from "../../interfaces/metric-update-body.interface";
import { MetricSearchParamsValidator } from "../../validators/metric-search-params.validator";
import { MetricCreateParamsValidator } from "../../validators/metric-create-params.validator";
import { MetricUpdateParamsValidator } from "../../validators/metric-update-params.validator";

const publicMetricAttributes = [
	"id",
	"orgId",
	"region",
	"accountId",
	"userId",
	"metricCategoryId",
	"metricTypeId",
	"metricTypeVersion",
	"deviceId",
	"batchId",
	"value",
	"takenAt",
	"takenAtOffset",
	"recordedAt",
	"arn"
] as const;
type MetricKeys = (typeof publicMetricAttributes)[number];
type PublicMetricAttributes = Pick<MetricAttributes, MetricKeys>;

@Route('v1/metrics')
@Tags('MetricController')
@autoInjectable()
export class MetricController {

	/**
	 * Search Metric records
	 */
	@OperationId("Search")
	@Get("/")
	@SuccessResponse(200, "Returns list of metrics")
	@DescribeAction("metrics/search")
	@ValidateFuncArgs(MetricSearchParamsValidator)
	public async search(
		@Queries() query: MetricSearchParamsInterface
	): Promise<SearchResultInterface<PublicMetricAttributes>> {
		return undefined;
	}

	/**
	 * Create Metric record, if table has the record with the same takenAt - this record will be replaced
	 */
	@OperationId("Create")
	@Post('/')
	@SuccessResponse(201, "Returns created metric")
	@DescribeAction("metrics/create")
	@DescribeResource("Organization", ({ body }) => Number(body.orgId))
	@DescribeResource("Account", ({ body }) => Number(body.accountId))
	@DescribeResource("User", ({ body }) => Number(body.userId))
	@DescribeResource("MetricCategory", ({ body }) => Number(body.metricCategoryId))
	@DescribeResource("MetricType", ({ body }) => Number(body.metricTypeId))
	@DescribeResource("Device", ({ body }) => Number(body.deviceId))
	@ValidateFuncArgs(MetricCreateParamsValidator)
	public async create(@Body() body: MetricCreateBodyInterface): Promise<PublicMetricAttributes> {
		return undefined;
	}
	/**
	 * Get Metric Types records
	 */
	@OperationId("Read")
	@Get('/:metricId')
	@SuccessResponse(200, "Returns metric")
	@DescribeAction("metrics/read")
	@DescribeResource("Metric", ({ params }) => Number(params.metricId))
	public async get(@Path() metricId: string): Promise<PublicMetricAttributes> {
		return undefined;
	}
	/**
	 * Update Metric  with one or few attributes
	 */
	@OperationId("Update")
	@Put('/:metricId')
	@SuccessResponse(200, "Returns updated metric")
	@DescribeAction("metrics/update")
	@DescribeResource("Metric", ({ params }) => Number(params.metricId))
	@ValidateFuncArgs(MetricUpdateParamsValidator)
	public async update(@Path() metricId: string, @Body() body: MetricUpdateBodyInterface): Promise<PublicMetricAttributes> {
		return undefined;
	}
	/**
	 * Mark Metric as deleted. Will be permanently deleted in 90 days.
	 */

	@OperationId("Delete")
	@Delete('/:metricId')
	@SuccessResponse(204, "Returns metric")
	@DescribeAction("metrics/delete")
	@DescribeResource("Metric", ({ params }) => Number(params.metricId))
	public async delete(@Path() metricId: string): Promise<void> {
		return undefined;
	}
}

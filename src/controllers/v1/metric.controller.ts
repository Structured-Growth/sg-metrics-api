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
import { TimestreamWrite } from 'aws-sdk';

const publicMetricAttributes = [
	"id",
	"orgId",
	"region",
	"accountId",
	"userId",
	"metricTypeId",
	"value",
	"takenAt",
	"recordedAt"
] as const;

type MetricKeys = (typeof publicMetricAttributes)[number];
type PublicMetricAttributes = Pick<MetricAttributes, MetricKeys>;

@Route('v1/metrics')
@Tags('MetricController')
@autoInjectable()
export class MetricController {

	@OperationId("Search")
	@Get("/")
	@SuccessResponse(200, "Returns list of metrics")
	@DescribeAction("metrics/search")
	@ValidateFuncArgs(MetricSearchParamsValidator)
	public async searchMetrics(@Query() query: MetricSearchParamsInterface): Promise<SearchResultInterface<PublicMetricAttributes>> {
		return undefined;
	}

	@OperationId("Create")
	@Post('/')
	@SuccessResponse(201, "Returns created model")
	@DescribeAction("metrics/create")
	@DescribeResource("Organization", ({ body }) => Number(body.orgId))
	@DescribeResource("Account", ({ body }) => Number(body.accountId))
	@DescribeResource("Metric Type", ({ body }) => Number(body.metricTypeId))
	@ValidateFuncArgs(MetricCreateParamsValidator)
	public async createMetric(@Body() body: MetricCreateBodyInterface): Promise<PublicMetricAttributes> {
		return undefined;
	}

	@OperationId("Read")
	@Get('/:metricId')
	@SuccessResponse(200, "Returns model")
	@DescribeAction("metrics/read")
	@DescribeResource("Metric", ({ params }) => Number(params.metricId))
	public async getMetric(@Path() metricId: string): Promise<PublicMetricAttributes> {
		return undefined;
	}

	@OperationId("Update")
	@Put('/:metricId')
	@SuccessResponse(200, "Returns updated model")
	@DescribeAction("metrics/update")
	@DescribeResource("Metric", ({ params }) => Number(params.metricId))
	@ValidateFuncArgs(MetricUpdateParamsValidator)
	public async updateMetric(@Path() metricId: string, @Body() body: MetricUpdateBodyInterface): Promise<PublicMetricAttributes> {
		return undefined;
	}

	@OperationId("Delete")
	@Delete('/:id')
	@SuccessResponse(204, "Returns nothing")
	@DescribeAction("metrics/delete")
	@DescribeResource("Metric", ({ params }) => Number(params.metricId))
	public async deleteMetric(@Path() metricId: string): Promise<void> {
		return undefined;
	}
}

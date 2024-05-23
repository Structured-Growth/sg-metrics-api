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
import { Metric, MetricAttributes } from "../../../database/models/metric";
import { MetricRepository } from "../../modules/metric/metric.repository";
import { MetricSearchParamsInterface } from "../../interfaces/metric-search-params.interface";
import { MetricCreateBodyInterface } from "../../interfaces/metric-create-body.interface";
import { MetricUpdateBodyInterface } from "../../interfaces/metric-update-body.interface";
import { MetricSearchParamsValidator } from "../../validators/metric-search-params.validator";
import { MetricCreateParamsValidator } from "../../validators/metric-create-params.validator";
import { MetricUpdateParamsValidator } from "../../validators/metric-update-params.validator";
import { pick } from "lodash";
import { MetricAggregateParamsInterface } from "../../interfaces/metric-aggregate-params.interface";
import { MetricAggregateResultInterface } from "../../interfaces/metric-aggregate-result.interface";

const publicMetricAttributes = [
	"id",
	"orgId",
	"region",
	"accountId",
	"userId",
	"relatedToRn",
	"metricCategoryId",
	"metricTypeId",
	"metricTypeVersion",
	"deviceId",
	"batchId",
	"value",
	"takenAt",
	"takenAtOffset",
	"recordedAt",
	"deletedAt",
	"arn",
] as const;
type MetricKeys = (typeof publicMetricAttributes)[number];
type PublicMetricAttributes = Pick<MetricAttributes, MetricKeys> & {};

@Route("v1/metrics")
@Tags("Metric")
@autoInjectable()
export class MetricController extends BaseController {
	constructor(@inject("MetricRepository") private metricRepository: MetricRepository) {
		super();
	}

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
		const { data, ...result } = await this.metricRepository.search(query);
		this.response.status(200);
		return {
			data: data.map((metric) => ({
				...(pick(metric.toJSON(), publicMetricAttributes) as PublicMetricAttributes),
				arn: metric.arn,
			})),
			...result,
		};
	}

	@OperationId("Aggregate")
	@Get("/aggregate")
	@SuccessResponse(200, "Returns list of aggregated metrics")
	@DescribeAction("metrics/aggregate")
	@ValidateFuncArgs(MetricSearchParamsValidator)
	public async aggregate(@Queries() query: MetricAggregateParamsInterface): Promise<MetricAggregateResultInterface> {
		const { data, ...result } = await this.metricRepository.aggregate(query);
		this.response.status(200);
		return {
			data,
			page: result.page,
			limit: result.limit,
		};
	}

	/**
	 * Create Metric record, if table has the record with the same takenAt - this record will be replaced
	 */
	@OperationId("Create")
	@Post("/")
	@SuccessResponse(201, "Returns created metric")
	@DescribeAction("metrics/create")
	@DescribeResource("Organization", ({ body }) => Number(body.orgId))
	@DescribeResource("Account", ({ body }) => Number(body.accountId))
	@DescribeResource("User", ({ body }) => Number(body.userId))
	@DescribeResource("MetricCategory", ({ body }) => Number(body.metricCategoryId))
	@DescribeResource("MetricType", ({ body }) => Number(body.metricTypeId))
	@DescribeResource("Device", ({ body }) => Number(body.deviceId))
	@ValidateFuncArgs(MetricCreateParamsValidator)
	async create(@Queries() query: {}, @Body() body: MetricCreateBodyInterface[]): Promise<PublicMetricAttributes[]> {
		const metrics = await this.metricRepository.create(body);
		this.response.status(201);

		return metrics.map((metric) => ({
			...(pick(metric.toJSON(), publicMetricAttributes) as PublicMetricAttributes),
			arn: metric.arn,
		}));
	}

	/**
	 * Get Metric Types records
	 */
	@OperationId("Read")
	@Get("/:metricId")
	@SuccessResponse(200, "Returns metric")
	@DescribeAction("metrics/read")
	@DescribeResource("Metric", ({ params }) => Number(params.metricId))
	public async get(@Path() metricId: string): Promise<PublicMetricAttributes> {
		const metric = await this.metricRepository.read(metricId);
		this.response.status(200);
		if (!metric) {
			throw new NotFoundError(`Metric ${metricId} not found`);
		}

		return {
			...(pick(metric.toJSON(), publicMetricAttributes) as PublicMetricAttributes),
			arn: metric.arn,
		};
	}

	/**
	 * Update Metric  with one or few attributes
	 */
	@OperationId("Update")
	@Put("/:metricId")
	@SuccessResponse(200, "Returns updated metric")
	@DescribeAction("metrics/update")
	@DescribeResource("Metric", ({ params }) => Number(params.metricId))
	@ValidateFuncArgs(MetricUpdateParamsValidator)
	public async update(
		@Path() metricId: string,
		@Queries() query: {},
		@Body() body: MetricUpdateBodyInterface
	): Promise<PublicMetricAttributes> {
		const metric = await this.metricRepository.update(metricId, body);

		return {
			...(pick(metric.toJSON(), publicMetricAttributes) as PublicMetricAttributes),
			arn: metric.arn,
		};
	}

	/**
	 * Mark Metric as deleted. Will be permanently deleted in 90 days.
	 */

	@OperationId("Delete")
	@Delete("/:metricId")
	@SuccessResponse(204, "Returns metric")
	@DescribeAction("metrics/delete")
	@DescribeResource("Metric", ({ params }) => Number(params.metricId))
	public async delete(@Path() metricId: string): Promise<void> {
		return undefined;
	}
}

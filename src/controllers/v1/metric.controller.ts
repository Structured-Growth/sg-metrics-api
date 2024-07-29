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
import { MetricAttributes } from "../../../database/models/metric";
import { MetricService } from "../../modules/metric/metric.service";
import { MetricSearchParamsInterface } from "../../interfaces/metric-search-params.interface";
import { MetricCreateBodyInterface } from "../../interfaces/metric-create-body.interface";
import { MetricUpdateBodyInterface } from "../../interfaces/metric-update-body.interface";
import { MetricSearchParamsValidator } from "../../validators/metric-search-params.validator";
import { MetricCreateParamsValidator } from "../../validators/metric-create-params.validator";
import { MetricUpdateParamsValidator } from "../../validators/metric-update-params.validator";
import { isUndefined, omitBy, pick } from "lodash";
import { MetricAggregateParamsInterface } from "../../interfaces/metric-aggregate-params.interface";
import { MetricAggregateResultInterface } from "../../interfaces/metric-aggregate-result.interface";
import { getTimezoneOffset } from "../../helpers/get-timezone-offset";
import { MetricAggregateParamsValidator } from "../../validators/metric-aggregate-params.validator";

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
	"arn",
] as const;
type MetricKeys = (typeof publicMetricAttributes)[number];
type PublicMetricAttributes = Pick<Omit<MetricAttributes, "deletedAt">, MetricKeys> & {};

interface MetricCreateBodyWithoutOffset extends Omit<MetricCreateBodyInterface, "takenAtOffset"> {}

@Route("v1/metrics")
@Tags("Metric")
@autoInjectable()
export class MetricController extends BaseController {
	constructor(@inject("MetricService") private metricService: MetricService) {
		super();
	}

	/**
	 * Search Metric records
	 */
	@OperationId("Search")
	@Get("/")
	@SuccessResponse(200, "Returns list of metrics")
	@DescribeAction("metrics/search")
	@DescribeResource("Organization", ({ query }) => ({
		arn: `-:-:${query.orgId}`,
	}))
	@ValidateFuncArgs(MetricSearchParamsValidator)
	public async search(@Queries() query: MetricSearchParamsInterface): Promise<
		SearchResultInterface<PublicMetricAttributes> & {
			nextToken?: string;
		}
	> {
		const { data, ...result } = await this.metricService.search(query);
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
	@ValidateFuncArgs(MetricAggregateParamsValidator)
	@DescribeResource("Organization", ({ query }) => ({
		arn: `-:-:${query.orgId}`,
	}))
	public async aggregate(@Queries() query: MetricAggregateParamsInterface): Promise<MetricAggregateResultInterface> {
		const { data, ...result } = await this.metricService.aggregate(query);
		this.response.status(200);
		return {
			data,
			limit: result.limit,
			nextToken: result.nextToken,
		};
	}

	/**
	 * Create Metric record, if table has the record with the same takenAt - this record will be replaced
	 */
	@OperationId("Create")
	@Post("/")
	@SuccessResponse(201, "Returns created metric")
	@DescribeAction("metrics/create")
	@DescribeResource("Organization", ({ body }) => Number(body[0].orgId))
	@DescribeResource("Account", ({ body }) => Number(body[0].accountId))
	@DescribeResource("User", ({ body }) => Number(body[0].userId))
	@DescribeResource("MetricCategory", ({ body }) => Number(body[0].metricCategoryId))
	@DescribeResource("MetricType", ({ body }) => Number(body[0].metricTypeId))
	@DescribeResource("Device", ({ body }) => Number(body[0].deviceId))
	@ValidateFuncArgs(MetricCreateParamsValidator)
	async create(@Queries() query: {}, @Body() body: MetricCreateBodyWithoutOffset[]): Promise<PublicMetricAttributes[]> {
		const metrics = await this.metricService.create(
			body.map((item) => {
				return {
					...item,
					takenAt: new Date(item.takenAt),
					takenAtOffset: getTimezoneOffset(item.takenAt.toString()),
				};
			})
		);

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
	@DescribeResource("Metric", ({ params }) => params.metricId)
	public async get(@Path() metricId: string): Promise<PublicMetricAttributes> {
		const metric = await this.metricService.read(metricId);
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
	@DescribeResource("Metric", ({ params }) => params.metricId)
	@ValidateFuncArgs(MetricUpdateParamsValidator)
	public async update(
		@Path() metricId: string,
		@Queries() query: {},
		@Body() body: MetricUpdateBodyInterface
	): Promise<PublicMetricAttributes> {
		const metric = await this.metricService.update(
			metricId,
			omitBy(
				{
					...body,
					takenAt: body.takenAt ? new Date(body.takenAt) : undefined,
					takenAtOffset: body.takenAt ? getTimezoneOffset(body.takenAt.toString()) : undefined,
				},
				isUndefined
			) as any
		);

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
	@DescribeResource("Metric", ({ params }) => params.metricId)
	public async delete(@Path() metricId: string): Promise<void> {
		await this.metricService.delete(metricId);
		this.response.status(204);
	}
}

import { Get, Route, Tags, Queries, OperationId, SuccessResponse, Body, Post, Path, Put, Delete } from "tsoa";
import {
	autoInjectable,
	BaseController,
	DescribeAction,
	DescribeResource,
	inject,
	NotFoundError,
	ValidateFuncArgs,
	SearchResultInterface,
	I18nType,
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
import {
	MetricAggregateResultInterface,
	MetricAggregationInterface,
} from "../../interfaces/metric-aggregate-result.interface";
import { getTimezoneOffset } from "../../helpers/get-timezone-offset";
import { MetricAggregateParamsValidator } from "../../validators/metric-aggregate-params.validator";
import { EventMutation } from "@structured-growth/microservice-sdk";
import { MetricsBulkRequestInterface } from "../../interfaces/metrics-bulk.request.interface";
import { MetricBulkRequestValidator } from "../../validators/metric-bulk-request.validator";
import { MetricsBulkResponseInterface } from "../../interfaces/metrics-bulk-response.interface";

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
	"metadata",
	"arn",
] as const;
type MetricKeys = (typeof publicMetricAttributes)[number];
export type PublicMetricAttributes = Pick<Omit<MetricAttributes, "deletedAt">, MetricKeys> & {};
export type PublicMetricAttributesExtended = PublicMetricAttributes & {
	metricTypeCode: string;
	metricCategoryCode: string;
	arn: string;
};

interface MetricCreateBodyWithoutOffset extends Omit<MetricCreateBodyInterface, "takenAtOffset"> {}

@Route("v1/metrics")
@Tags("Metric")
@autoInjectable()
export class MetricController extends BaseController {
	private i18n: I18nType;
	constructor(
		@inject("MetricService") private metricService: MetricService,
		@inject("i18n") private getI18n: () => I18nType
	) {
		super();
		this.i18n = this.getI18n();
	}

	/**
	 * Search Metric records
	 */
	@OperationId("Search")
	@Get("/")
	@SuccessResponse(200, "Returns list of metrics")
	@DescribeAction("metrics/search")
	@DescribeResource("Organization", ({ query }) => Number(query.orgId))
	@DescribeResource("Account", ({ query }) => query.accountId?.map(Number))
	@DescribeResource("User", ({ query }) => query.userId?.map(Number))
	@DescribeResource("Device", ({ query }) => Number(query.deviceId))
	@DescribeResource("MetricCategory", ({ query }) => Number(query.metricCategoryId))
	@DescribeResource("MetricType", ({ query }) => query.metricTypeId?.map(Number))
	@DescribeResource("Metric", ({ query }) => query.id?.map(Number))
	@ValidateFuncArgs(MetricSearchParamsValidator)
	public async search(@Queries() query: MetricSearchParamsInterface): Promise<
		SearchResultInterface<PublicMetricAttributesExtended> & {
			nextToken?: string;
		}
	> {
		const { data, ...result } = await this.metricService.search(query);
		this.response.status(200);

		return {
			data: data.map((metric) => ({
				...(pick(metric.toJSON(), publicMetricAttributes) as PublicMetricAttributes),
				arn: metric.arn,
				metricTypeCode: metric.metricTypeCode,
				metricCategoryCode: metric.metricCategoryCode,
			})),
			...result,
		};
	}

	@OperationId("Aggregate")
	@Get("/aggregate")
	@SuccessResponse(200, "Returns list of aggregated metrics")
	@DescribeAction("metrics/aggregate")
	@ValidateFuncArgs(MetricAggregateParamsValidator)
	@DescribeResource("Organization", ({ query }) => Number(query.orgId))
	@DescribeResource("Account", ({ query }) => query.accountId?.map(Number))
	@DescribeResource("User", ({ query }) => query.userId?.map(Number))
	@DescribeResource("Device", ({ query }) => Number(query.deviceId))
	@DescribeResource("MetricCategory", ({ query }) => Number(query.metricCategoryId))
	@DescribeResource("MetricType", ({ query }) => query.metricTypeId?.map(Number))
	@DescribeResource("Metric", ({ query }) => query.id?.map(Number))
	public async aggregate(@Queries() query: MetricAggregateParamsInterface): Promise<
		MetricAggregateResultInterface & {
			data: MetricAggregationInterface[];
		}
	> {
		const { data, ...result } = await this.metricService.aggregate(query);
		this.response.status(200);

		return {
			data: data.map((row: MetricAggregationInterface & { metricTypeCode: string }) => ({
				...row,
				metricTypeCode: row.metricTypeCode,
			})),
			page: result.page,
			total: result.total,
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
	@DescribeResource("Organization", ({ body }) => body.map((i) => i.orgId))
	@DescribeResource("Account", ({ body }) => body.map((i) => i.accountId))
	@DescribeResource("User", ({ body }) => body.map((i) => i.userId))
	@DescribeResource("MetricCategory", ({ body }) => body.map((i) => i.metricCategoryId))
	@DescribeResource("MetricType", ({ body }) => body.map((i) => i.metricTypeId))
	@DescribeResource("Device", ({ body }) => body.map((i) => i.deviceId))
	@ValidateFuncArgs(MetricCreateParamsValidator)
	async create(
		@Queries() query: {},
		@Body() body: MetricCreateBodyWithoutOffset[]
	): Promise<PublicMetricAttributesExtended[]> {
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
			metricTypeCode: metric.metricTypeCode,
			metricCategoryCode: metric.metricCategoryCode,
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
	public async get(@Path() metricId: string): Promise<PublicMetricAttributesExtended> {
		const metric = await this.metricService.read(metricId);
		this.response.status(200);
		if (!metric) {
			throw new NotFoundError(
				`${this.i18n.__("error.metric.name")} ${metricId} ${this.i18n.__("error.common.not_found")}`
			);
		}

		return {
			...(pick(metric.toJSON(), publicMetricAttributes) as PublicMetricAttributes),
			arn: metric.arn,
			metricTypeCode: metric.metricTypeCode,
			metricCategoryCode: metric.metricCategoryCode,
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
	): Promise<PublicMetricAttributesExtended> {
		const metric = await this.metricService.update(
			metricId,
			omitBy(
				{
					...body,
					takenAt: body.takenAt ? new Date(body.takenAt) : undefined,
					takenAtOffset: body.takenAt ? getTimezoneOffset(body.takenAt.toString()) : undefined,
					metadata: body.metadata,
					metricTypeCode: body.metricTypeCode,
					metricTypeVersion: body.metricTypeVersion,
				},
				isUndefined
			) as any
		);

		await this.eventBus.publish(
			new EventMutation(this.principal.arn, metric.arn, `${this.appPrefix}:metrics/update`, JSON.stringify(body))
		);

		return {
			...(pick(metric.toJSON(), publicMetricAttributes) as PublicMetricAttributes),
			arn: metric.arn,
			metricTypeCode: metric.metricTypeCode,
			metricCategoryCode: metric.metricCategoryCode,
		};
	}

	/**
	 * Create metric or update if it already exists
	 */
	@OperationId("Upsert")
	@Post("/upsert")
	@SuccessResponse(200, "Returns created or updated metric")
	@DescribeAction("metrics/upsert")
	@ValidateFuncArgs(MetricCreateParamsValidator)
	public async upsert(
		@Queries() query: {},
		@Body() body: MetricCreateBodyWithoutOffset[]
	): Promise<PublicMetricAttributesExtended[]> {
		const metrics = await this.metricService.upsert(
			body.map((item) => {
				return {
					...item,
					takenAt: new Date(item.takenAt),
					takenAtOffset: getTimezoneOffset(item.takenAt.toString()),
				};
			})
		);

		this.response.status(200);

		return metrics.map((metric) => ({
			...(pick(metric.toJSON(), publicMetricAttributes) as PublicMetricAttributes),
			arn: metric.arn,
			metricTypeCode: metric.metricTypeCode,
			metricCategoryCode: metric.metricCategoryCode,
		}));
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
		const metric = await this.metricService.read(metricId);

		if (!metric) {
			throw new NotFoundError(
				`${this.i18n.__("error.metric.name")} ${metricId} ${this.i18n.__("error.common.not_found")}`
			);
		}

		await this.metricService.delete(metricId);

		await this.eventBus.publish(
			new EventMutation(this.principal.arn, metric.arn, `${this.appPrefix}:metrics/delete`, JSON.stringify({}))
		);

		this.response.status(204);
	}

	/**
	 * Run operations in a single transaction
	 */
	@OperationId("Bulk")
	@Post("/bulk")
	@SuccessResponse(204, "Operations success")
	@DescribeAction("metrics/bulk")
	@ValidateFuncArgs(MetricBulkRequestValidator)
	public async bulk(
		@Queries() query: {},
		@Body() body: MetricsBulkRequestInterface
	): Promise<MetricsBulkResponseInterface> {
		const result = await this.metricService.bulk(body);

		return result.map(({ op, data }) => {
			switch (op) {
				case "create":
				case "update":
				case "upsert":
					return {
						op,
						data: {
							...(pick(data.toJSON(), publicMetricAttributes) as PublicMetricAttributes),
							arn: data.arn,
						},
					};
				default:
					return { op, data };
			}
		});
	}
}

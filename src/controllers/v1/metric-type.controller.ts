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
	I18nType,
	HashFields,
} from "@structured-growth/microservice-sdk";
import { MetricTypeAttributes } from "../../../database/models/metric-type.sequelize";
import { MetricTypeSearchParamsInterface } from "../../interfaces/metric-type-search-params.interface";
import { MetricTypeCreateBodyInterface } from "../../interfaces/metric-type-create-body.interface";
import { MetricTypeUpdateBodyInterface } from "../../interfaces/metric-type-update-body.interface";
import { MetricTypeSearchParamsValidator } from "../../validators/metric-type-search-params.validator";
import { MetricTypeCreateParamsValidator } from "../../validators/metric-type-create-params.validator";
import { MetricTypeUpdateParamsValidator } from "../../validators/metric-type-update-params.validator";
import { MetricTypeService } from "../../modules/metric-type/metric-type.service";
import { MetricTypeRepository } from "../../modules/metric-type/metric-type.repository";
import { pick } from "lodash";
import { EventMutation } from "@structured-growth/microservice-sdk";

const publicMetricTypeAttributes = [
	"id",
	"orgId",
	"region",
	"accountId",
	"metricCategoryId",
	"title",
	"code",
	"unit",
	"factor",
	"relatedTo",
	"version",
	"status",
	"createdAt",
	"updatedAt",
	"arn",
] as const;
type MetricTypeKeys = (typeof publicMetricTypeAttributes)[number];
type PublicMetricTypeAttributes = Pick<MetricTypeAttributes, MetricTypeKeys> & {
	metadata: Record<string, string>;
};

@Route("v1/metric-type")
@Tags("Metric Type")
@autoInjectable()
export class MetricTypeController extends BaseController {
	private i18n: I18nType;
	constructor(
		@inject("MetricTypeRepository") private metricTypeRepository: MetricTypeRepository,
		@inject("MetricTypeService") private metricTypeService: MetricTypeService,
		@inject("i18n") private getI18n: () => I18nType
	) {
		super();
		this.i18n = this.getI18n();
	}

	/**
	 * Search Metric Types records
	 */
	@OperationId("Search")
	@Get("/")
	@SuccessResponse(200, "Returns list of metric types")
	@DescribeAction("metric-type/search")
	@DescribeResource("Organization", ({ query }) => Number(query.orgId))
	@DescribeResource("Account", ({ query }) => Number(query.accountId))
	@DescribeResource("MetricType", ({ query }) => query.id?.map(Number))
	@HashFields(["title", "code", "unit", "factor"])
	@ValidateFuncArgs(MetricTypeSearchParamsValidator)
	async search(
		@Queries() query: MetricTypeSearchParamsInterface
	): Promise<SearchResultInterface<PublicMetricTypeAttributes>> {
		const { data, ...result } = await this.metricTypeService.search({
			...query,
			includeInherited: query.includeInherited?.toString() !== "false",
		});
		this.response.status(200);

		return {
			data: data.map((metricType) => ({
				...(pick(metricType.toJSON(), publicMetricTypeAttributes) as PublicMetricTypeAttributes),
				metadata: metricType.metadata,
				arn: metricType.arn,
			})),
			...result,
		};
	}

	/**
	 * Create Metric Type record
	 */
	@OperationId("Create")
	@Post("/")
	@SuccessResponse(201, "Returns created model")
	@DescribeAction("metric-type/create")
	@DescribeResource("Organization", ({ body }) => Number(body.orgId))
	@DescribeResource("Account", ({ body }) => Number(body.accountId))
	@DescribeResource("MetricCategory", ({ body }) => Number(body.metricCategoryId))
	@HashFields(["title", "code", "unit", "factor"])
	@ValidateFuncArgs(MetricTypeCreateParamsValidator)
	async create(@Queries() query: {}, @Body() body: MetricTypeCreateBodyInterface): Promise<PublicMetricTypeAttributes> {
		const metricType = await this.metricTypeService.create(body);
		this.response.status(201);

		await this.eventBus.publish(
			new EventMutation(
				this.principal.arn,
				metricType.arn,
				`${this.appPrefix}:metric-type/create`,
				JSON.stringify(body)
			)
		);

		return {
			...(pick(metricType.toJSON(), publicMetricTypeAttributes) as PublicMetricTypeAttributes),
			metadata: metricType.metadata,
			arn: metricType.arn,
		};
	}

	/**
	 * Get Metric Types records
	 */
	@OperationId("Read")
	@Get("/:metricTypeId")
	@SuccessResponse(200, "Returns model")
	@DescribeAction("metric-type/read")
	@DescribeResource("MetricType", ({ params }) => Number(params.metricTypeId))
	@HashFields(["title", "code", "unit", "factor"])
	async get(@Path() metricTypeId: number): Promise<PublicMetricTypeAttributes> {
		const metricType = await this.metricTypeRepository.read(metricTypeId);
		this.response.status(200);
		if (!metricType) {
			throw new NotFoundError(
				`${this.i18n.__("error.metric_type.name")} ${metricTypeId} ${this.i18n.__("error.common.not_found")}`
			);
		}

		return {
			...(pick(metricType.toJSON(), publicMetricTypeAttributes) as PublicMetricTypeAttributes),
			metadata: metricType.metadata,
			arn: metricType.arn,
		};
	}

	/**
	 * Update Metric Type with one or few attributes
	 */
	@OperationId("Update")
	@Put("/:metricTypeId")
	@SuccessResponse(200, "Returns updated model")
	@DescribeAction("metric-type/update")
	@DescribeResource("MetricType", ({ params }) => Number(params.metricTypeId))
	@HashFields(["title", "code", "unit", "factor"])
	@ValidateFuncArgs(MetricTypeUpdateParamsValidator)
	async update(
		@Path() metricTypeId: number,
		@Queries() query: {},
		@Body() body: MetricTypeUpdateBodyInterface
	): Promise<PublicMetricTypeAttributes> {
		const metricType = await this.metricTypeService.update(metricTypeId, body);
		this.response.status(200);

		await this.eventBus.publish(
			new EventMutation(
				this.principal.arn,
				metricType.arn,
				`${this.appPrefix}:metric-type/update`,
				JSON.stringify(body)
			)
		);

		return {
			...(pick(metricType.toJSON(), publicMetricTypeAttributes) as PublicMetricTypeAttributes),
			metadata: metricType.metadata,
			arn: metricType.arn,
		};
	}

	/**
	 * Mark Metric Type as deleted. Will be permanently deleted in 90 days.
	 */
	@OperationId("Delete")
	@Delete("/:metricTypeId")
	@SuccessResponse(204, "Returns nothing")
	@DescribeAction("metric-type/delete")
	@DescribeResource("MetricType", ({ params }) => Number(params.metricTypeId))
	async delete(@Path() metricTypeId: number): Promise<void> {
		const metricType = await this.metricTypeRepository.read(metricTypeId);

		if (!metricType) {
			throw new NotFoundError(
				`${this.i18n.__("error.metric_type.name")} ${metricTypeId} ${this.i18n.__("error.common.not_found")}`
			);
		}
		await this.metricTypeService.delete(metricTypeId);

		await this.eventBus.publish(
			new EventMutation(this.principal.arn, metricType.arn, `${this.appPrefix}:metric-type/delete`, JSON.stringify({}))
		);

		this.response.status(204);
	}
}

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
import { MetricTypeAttributes } from "../../../database/models/metric-type.sequelize";
import { MetricTypeSearchParamsInterface } from "../../interfaces/metric-type-search-params.interface";
import { MetricTypeCreateBodyInterface } from "../../interfaces/metric-type-create-body.interface";
import { MetricTypeUpdateBodyInterface } from "../../interfaces/metric-type-update-body.interface";
import { MetricTypeSearchParamsValidator } from "../../validators/metric-type-search-params.validator";
import { MetricTypeCreateParamsValidator } from "../../validators/metric-type-create-params.validator";
import { MetricTypeUpdateParamsValidator } from "../../validators/metric-type-update-params.validator";
import { MetricTypeService } from "../../modules/metric-type/metric-type.service";
import { MetricTypeRepository } from "../../modules/metric-type/metric-type.repository";
import {pick} from "lodash";

const publicMetricTypeAttributes = [
	"id",
	"orgId",
	"region",
	"metricCategoryId",
	"title",
	"code",
	"unit",
	"factor",
	"version",
	"status",
	"createdAt",
	"updatedAt",
	"arn",
] as const;
type MetricTypeKeys = (typeof publicMetricTypeAttributes)[number];
type PublicMetricTypeAttributes = Pick<MetricTypeAttributes, MetricTypeKeys> & {
	metadata: Record<any, any>;
};


@Route("v1/metric-type")
@Tags("Metric Type")
@autoInjectable()
export class MetricTypeController extends BaseController {
	constructor(
		@inject("MetricTypeRepository") private metricTypeRepository: MetricTypeRepository,
		@inject("MetricTypeService") private metricTypeService: MetricTypeService
	) {
		super();
	}
	/**
	 * Search Metric Types records
	 */
	@OperationId("Search")
	@Get("/")
	@SuccessResponse(200, "Returns list of metric types")
	@DescribeAction("metric-type/search")
	@DescribeResource("Organization", ({ query }) => Number(query.orgId))
	@DescribeResource(
		"MetricTypeStatus",
		({ query }) => query.status as string,
		`${container.resolve("appPrefix")}:<region>:<orgId>:metric-type-status/<metricTypeStatus>`
	)
	@ValidateFuncArgs(MetricTypeSearchParamsValidator)
	async search(@Queries() query: MetricTypeSearchParamsInterface
	): Promise<SearchResultInterface<PublicMetricTypeAttributes>> {
		const { data, ...result } = await this.metricTypeRepository.search(query);

		return {
			data: data.map((metricType) => ({
				...(pick(metricType.toJSON(), publicMetricTypeAttributes) as PublicMetricTypeAttributes),
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
	@DescribeResource("MetricCategory", ({ body }) => Number(body.metricCategoryId))
	@ValidateFuncArgs(MetricTypeCreateParamsValidator)
	async create(@Queries() query: {}, @Body() body: MetricTypeCreateBodyInterface): Promise<PublicMetricTypeAttributes> {
		const metricType = await this.metricTypeService.create(body);
		this.response.status(201);

		return {
			...(pick(metricType.toJSON(), publicMetricTypeAttributes) as PublicMetricTypeAttributes),
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
	async get(@Path() metricTypeId: number): Promise<PublicMetricTypeAttributes> {
		const metricType = await this.metricTypeRepository.read(metricTypeId);

		if (!metricType) {
			throw new NotFoundError(`Metric Category ${metricTypeId} not found`);
		}

		return {
			...(pick(metricType.toJSON(), publicMetricTypeAttributes) as PublicMetricTypeAttributes),
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
	@ValidateFuncArgs(MetricTypeUpdateParamsValidator)
	async update(
		@Path() metricTypeId: number,
		@Queries() query: {},
		@Body() body: MetricTypeUpdateBodyInterface
	): Promise<PublicMetricTypeAttributes> {
		const metricType = await this.metricTypeService.update(metricTypeId, body);
		this.response.status(201);

		return {
			...(pick(metricType.toJSON(), publicMetricTypeAttributes) as PublicMetricTypeAttributes),
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
			throw new NotFoundError(`Metric Type ${metricTypeId} not found`);
		}
		await this.metricTypeRepository.delete(metricTypeId);
		this.response.status(204);
	}
}

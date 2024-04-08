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
import { pick } from "lodash";
import { MetricTypeAttributes } from "../../../database/models/metric-type";
import { MetricTypeSearchParamsInterface } from "../../interfaces/metric-type-search-params.interface";
import { MetricTypeCreateBodyInterface } from "../../interfaces/metric-type-create-body.interface";
import { MetricTypeUpdateBodyInterface } from "../../interfaces/metric-type-update-body.interface";
import { MetricTypeSearchParamsValidator } from "../../validators/metric-type-search-params.validator";
import { MetricTypeCreateParamsValidator } from "../../validators/metric-type-create-params.validator";
import { MetricTypeUpdateParamsValidator } from "../../validators/metric-type-update-params.validator";

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
type PublicAccountAttributes = Pick<MetricTypeAttributes, MetricTypeKeys>;


@Route("v1/metric-types")
@Tags("MetricTypeController")
@autoInjectable()
export class MetricTypeController extends BaseController {
	/**
	 * Search Metric Types records
	 */
	@OperationId("Search")
	@Get("/")
	@SuccessResponse(200, "Returns list of metric types")
	@DescribeAction("metric-types/search")
	@DescribeResource("Organization", ({ query }) => Number(query.orgId))
	@DescribeResource(
		"MetricTypeStatus",
		({ query }) => query.status as string,
		`${container.resolve("appPrefix")}:<region>:<orgId>:metric-type-status/<metricTypeStatus>`
	)
	@ValidateFuncArgs(MetricTypeSearchParamsValidator)
	async search(@Queries() query: MetricTypeSearchParamsInterface
	): Promise<SearchResultInterface<PublicAccountAttributes>> {
		return undefined;
	}

	/**
	 * Create Metric Types
	 */
	@OperationId("Create")
	@Post("/")
	@SuccessResponse(201, "Returns created model")
	@DescribeAction("metric-types/create")
	@DescribeResource("Organization", ({ body }) => Number(body.orgId))
	@DescribeResource("Metric Category", ({ body }) => Number(body.metricCategoryId))
	@ValidateFuncArgs(MetricTypeCreateParamsValidator)
	async create(@Queries() query: {}, @Body() body: MetricTypeCreateBodyInterface): Promise<PublicAccountAttributes> {
		return undefined;
	}

	/**
	 * Get Metric Types
	 */
	@OperationId("Read")
	@Get("/:metricTypeId")
	@SuccessResponse(200, "Returns model")
	@DescribeAction("metric-types/read")
	@DescribeResource("Metric Type", ({ params }) => Number(params.metricTypeId))
	async get(@Path() metricTypeId: number): Promise<PublicAccountAttributes> {
		return undefined;
	}

	/**
	 * Update Metric Types
	 */
	@OperationId("Update")
	@Put("/:metricTypeId")
	@SuccessResponse(200, "Returns updated model")
	@DescribeAction("metric-types/update")
	@DescribeResource("Metric Type", ({ params }) => Number(params.metricTypeId))
	@ValidateFuncArgs(MetricTypeUpdateParamsValidator)
	async update(
		@Path() metricTypeId: number,
		@Queries() query: {},
		@Body() body: MetricTypeUpdateBodyInterface
	): Promise<PublicAccountAttributes> {
		return undefined;
	}

	/**
	 * Delete Metric Types
	 */
	@OperationId("Delete")
	@Delete("/:metricTypeId")
	@SuccessResponse(204, "Returns nothing")
	@DescribeAction("metric-types/delete")
	@DescribeResource("Metric Type", ({ params }) => Number(params.metricTypeId))
	async delete(@Path() metricTypeId: number): Promise<void> {
		return undefined;
	}
}

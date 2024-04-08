import { Get, Route, Tags, Queries, OperationId, SuccessResponse, Body, Post, Path, Put, Delete } from "tsoa";
import {
	autoInjectable,
	inject,
	BaseController,
	container,
	DescribeAction,
	DescribeResource,
	SearchResultInterface,
	ValidateFuncArgs,
	NotFoundError,
} from "@structured-growth/microservice-sdk";
import { pick } from "lodash";
import { MetricCategory, MetricCategoryAttributes } from "../../../database/models/metric-category";
import { MetricCategorySearchParamsInterface } from "../../interfaces/metric-category-search-params.interface";
import { MetricCategoryCreateBodyInterface } from "../../interfaces/metric-category-create-body.interface";
import { MetricCategoryUpdateBodyInterface } from "../../interfaces/metric-category-update-body.interface";
import { MetricCategorySearchParamsValidator } from "../../validators/metric-category-search-params.validator";
import { MetricCategoryCreateParamsValidator } from "../../validators/metric-category-create-params.validator";
import { MetricCategoryUpdateSearchParamsValidator } from "../../validators/metric-category-update-params.validator";

const publicMetricCategoryAttributes = [
	"id",
	"orgId",
	"region",
	"title",
	"status",
	"createdAt",
	"updatedAt",
	"arn",
] as const;
type MetricCategoryKeys = (typeof publicMetricCategoryAttributes)[number];
type PublicMetricCategoryAttributes = Pick<MetricCategoryAttributes, MetricCategoryKeys>;


@Route("v1/category")
@Tags("MetricCategoryController")
@autoInjectable()
export class MetricCategoryController extends BaseController {
	/**
	 * Search MetricCategory records
	 */
	@OperationId("Search")
	@Get("/")
	@SuccessResponse(200, "Returns list of categories")
	@DescribeAction("metric-category/search")
	@DescribeResource("Organization", ({ query }) => Number(query.orgId))
	@DescribeResource(
		"CategoryStatus",
		({ query }) => query.status as string,
		`${container.resolve("appPrefix")}:<region>:<orgId>:metric-category-status/<metricCategoryStatus>`
	)
	@ValidateFuncArgs(MetricCategorySearchParamsValidator)
	async search(
		@Queries() query: MetricCategorySearchParamsInterface
	): Promise<SearchResultInterface<PublicMetricCategoryAttributes>> {
		return undefined;
	}

	/**
	 * Create MetricCategory
	 */
	@OperationId("Create")
	@Post("/")
	@SuccessResponse(201, "Returns created category")
	@DescribeAction("metric-category/create")
	@DescribeResource("Organization", ({ body }) => Number(body.orgId))
	@ValidateFuncArgs(MetricCategoryCreateParamsValidator)
	async create(
		@Queries() query: {},
		@Body() body: MetricCategoryCreateBodyInterface
	): Promise<PublicMetricCategoryAttributes> {
		return undefined;
	}

	/**
	 * Get MetricCategory
	 */
	@OperationId("Read")
	@Get("/:metricCategoryId")
	@SuccessResponse(200, "Returns category")
	@DescribeAction("metric-category/read")
	@DescribeResource("MetricCategory", ({ params }) => Number(params.metricCategoryId))
	async get(@Path() catId: number): Promise<PublicMetricCategoryAttributes> {
		return undefined;
	}

	/**
	 * Update MetricCategory
	 */
	@OperationId("Update")
	@Put("/:metricCategoryId")
	@SuccessResponse(200, "Returns updated category")
	@DescribeAction("metric-category/update")
	@DescribeResource("MetricCategory", ({ params }) => Number(params.metricCategoryId))
	@ValidateFuncArgs(MetricCategoryUpdateSearchParamsValidator)
	async update(
		@Path() catId: number,
		@Queries() query: {},
		@Body() body: MetricCategoryUpdateBodyInterface
	): Promise<PublicMetricCategoryAttributes> {
		return undefined;
	}

	/**
	 * Delete Example
	 */
	@OperationId("Delete")
	@Delete("/:metricCategoryId")
	@SuccessResponse(204, "Returns nothing")
	@DescribeAction("metric-category/delete")
	@DescribeResource("MetricCategory", ({ params }) => Number(params.metricCategoryId))
	async delete(@Path() catId: number): Promise<void> {
		return undefined;
	}
}

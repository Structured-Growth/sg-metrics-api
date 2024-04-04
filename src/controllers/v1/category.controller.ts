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
import { Category, CategoryAttributes } from "../../../database/models/category";
import { CategorySearchParamsInterface } from "../../interfaces/category-search-params.interface";
import { CategoryCreateBodyInterface } from "../../interfaces/category-create-body.interface";
import { CategoryUpdateBodyInterface } from "../../interfaces/category-update-body.interface";
import { ExampleSearchParamsValidator } from "../../validators/example-search-params.validator";

const publicCategoryAttributes = [
	"catId",
	"orgId",
	"region",
	"title",
	"status",
	"createdAt",
	"updatedAt",
	"arn",
] as const;
type CategoryKeys = (typeof publicCategoryAttributes)[number];
type PublicCategoryAttributes = Pick<CategoryAttributes, CategoryKeys>;


@Route("v1/category")
@Tags("CategoryController")
@autoInjectable()
export class CategoryController extends BaseController {
	/**
	 * Search Example records
	 */
	@OperationId("Search")
	@Get("/")
	@SuccessResponse(200, "Returns list of categories")
	@DescribeAction("category/search")
	@DescribeResource("Organization", ({ query }) => Number(query.orgId))
	@DescribeResource(
		"CategoryStatus",
		({ query }) => query.status as string,
		`${container.resolve("appPrefix")}:<region>:<orgId>:category-status/<categoryStatus>`
	)
	@ValidateFuncArgs(ExampleSearchParamsValidator)
	async search(
		@Queries() query: CategorySearchParamsInterface
	): Promise<SearchResultInterface<PublicCategoryAttributes>> {
		return undefined;
	}

	/**
	 * Create Example
	 */
	@OperationId("Create")
	@Post("/")
	@SuccessResponse(201, "Returns created category")
	@DescribeAction("category/create")
	@DescribeResource("Organization", ({ body }) => Number(body.orgId))
	async create(
		@Queries() query: {},
		@Body() body: CategoryCreateBodyInterface
	): Promise<PublicCategoryAttributes> {
		return undefined;
	}

	/**
	 * Get Example
	 */
	@OperationId("Read")
	@Get("/:catId")
	@SuccessResponse(200, "Returns category")
	@DescribeAction("category/read")
	@DescribeResource("Category", ({ params }) => Number(params.catId))
	async get(@Path() catId: number): Promise<PublicCategoryAttributes> {
		return undefined;
	}

	/**
	 * Update Example
	 */
	@OperationId("Update")
	@Put("/:catId")
	@SuccessResponse(200, "Returns updated category")
	@DescribeAction("category/update")
	@DescribeResource("Category", ({ params }) => Number(params.catId))
	async update(
		@Path() catId: number,
		@Queries() query: {},
		@Body() body: CategoryUpdateBodyInterface
	): Promise<PublicCategoryAttributes> {
		return undefined;
	}

	/**
	 * Delete Example
	 */
	@OperationId("Delete")
	@Delete("/:catId")
	@SuccessResponse(204, "Returns nothing")
	@DescribeAction("category/delete")
	@DescribeResource("Category", ({ params }) => Number(params.catId))
	async delete(@Path() catId: number): Promise<void> {
		return undefined;
	}
}

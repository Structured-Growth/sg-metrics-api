import { Get, Route, Tags, Queries, OperationId, SuccessResponse, Body, Post, Path, Put, Delete } from "tsoa";
import {
	autoInjectable,
	BaseController,
	DescribeAction,
	DescribeResource,
	SearchResultInterface,
	ValidateFuncArgs,
} from "@structured-growth/microservice-sdk";
import { ExampleAttributes } from "../../../database/models/example";
import { ExampleSearchParamsInterface } from "../../interfaces/example-search-params.interface";
import { ExampleCreateBodyInterface } from "../../interfaces/example-create-body.interface";
import { ExampleUpdateBodyInterface } from "../../interfaces/example-update-body.interface";
import { ExampleSearchParamsValidator } from "../../validators/example-search-params.validator";

/**
 * This is just an example of a controller with search and CRUD operations over a model.
 */
@Route("v1/examples")
@Tags("ExampleController")
@autoInjectable()
export class ExampleController extends BaseController {
	/**
	 * Search Example records
	 */
	@OperationId("Search")
	@Get("/")
	@SuccessResponse(200, "Returns list of entities")
	@DescribeAction("example/search")
	@DescribeResource("Organization", ({ query }) => Number(query.orgId), "sg-api:<region>:<orgId>")
	@DescribeResource("Account", ({ query }) => Number(query.accountId), "sg-api:<region>:<orgId>:<accountId>")
	@DescribeResource("Example", ({ query }) => Number(query.id?.[0]))
	@DescribeResource(
		"ExampleStatus",
		({ query }) => query.status as string,
		"sg-api:<region>:<orgId>:<accountId>:example-status/<exampleStatus>"
	)
	@ValidateFuncArgs(ExampleSearchParamsValidator)
	async search(@Queries() query: ExampleSearchParamsInterface): Promise<SearchResultInterface<ExampleAttributes>> {
		return undefined;
	}

	/**
	 * Create Example
	 */
	@OperationId("Create")
	@Post("/")
	@SuccessResponse(201, "Returns created model")
	@DescribeAction("example/create")
	@DescribeResource("Organization", ({ query }) => Number(query.orgId), "sg-api:<region>:<orgId>")
	@DescribeResource("Account", ({ query }) => Number(query.accountId), "sg-api:<region>:<orgId>:<accountId>")
	async create(@Queries() query: {}, @Body() body: ExampleCreateBodyInterface): Promise<ExampleAttributes> {
		return undefined;
	}

	/**
	 * Get Example
	 */
	@OperationId("Read")
	@Get("/:exampleId")
	@SuccessResponse(200, "Returns model")
	@DescribeAction("example/read")
	@DescribeResource("Example", ({ params }) => Number(params.exampleId))
	async get(@Path() exampleId: number): Promise<ExampleAttributes> {
		return undefined;
	}

	/**
	 * Update Example
	 */
	@OperationId("Update")
	@Put("/:exampleId")
	@SuccessResponse(200, "Returns updated model")
	@DescribeAction("example/update")
	@DescribeResource("Example", ({ params }) => Number(params.exampleId))
	async update(
		@Path() exampleId: number,
		@Queries() query: {},
		@Body() body: ExampleUpdateBodyInterface
	): Promise<ExampleAttributes> {
		return undefined;
	}

	/**
	 * Delete Example
	 */
	@OperationId("Delete")
	@Delete("/:exampleId")
	@SuccessResponse(204, "Returns nothing")
	@DescribeAction("example/delete")
	@DescribeResource("Example", ({ params }) => Number(params.exampleId))
	async delete(@Path() exampleId: number): Promise<void> {
		return undefined;
	}
}

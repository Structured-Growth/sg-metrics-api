import { Get, NoSecurity, OperationId, Route, SuccessResponse, Tags } from "tsoa";
import { autoInjectable, BaseController, DescribeAction, NotFoundError } from "@structured-growth/microservice-sdk";
import { readFile } from "node:fs/promises";
import * as path from "node:path";

@Route("v1/docs")
@Tags("DocsController")
@autoInjectable()
export class DocsController extends BaseController {
	@OperationId("Get OpenAPI spec")
	@NoSecurity()
	@Get("/swagger.json")
	@DescribeAction("docs/swagger")
	@SuccessResponse(200, "Returns OpenAPI spec")
	public async getSwagger(): Promise<Record<string, unknown>> {
		const rootDir = process.env.LAMBDA_TASK_ROOT || process.cwd();
		const swaggerPath = path.join(rootDir, ".docs", "openapi.v1", "swagger.json");
		let swaggerRaw: string;

		try {
			swaggerRaw = await readFile(swaggerPath, "utf-8");
		} catch (error) {
			if (error?.code === "ENOENT") {
				throw new NotFoundError("Swagger file not found");
			}
			throw error;
		}

		return JSON.parse(swaggerRaw);
	}
}

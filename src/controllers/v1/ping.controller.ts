import { Get, NoSecurity, Route, Tags, OperationId, SuccessResponse } from "tsoa";
import { autoInjectable, BaseController, DescribeAction } from "@structured-growth/microservice-sdk";
import { inject } from "@structured-growth/microservice-sdk";

@Route("v1/ping")
@Tags("Ping")
@autoInjectable()
export class PingController extends BaseController {
	/**
	 * Check if server is alive
	 */
	@OperationId("Alive")
	@NoSecurity()
	@Get("/alive")
	@DescribeAction("ping/alive")
	@SuccessResponse(200, "Returns response body")
	async pingGet(): Promise<{ message: string }> {
		return {
			message: `I'm ${this.appPrefix} service`,
		};
	}
}

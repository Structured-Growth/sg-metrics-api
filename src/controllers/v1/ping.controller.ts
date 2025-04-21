import { Get, NoSecurity, Route, Tags, OperationId, SuccessResponse } from "tsoa";
import { autoInjectable, BaseController, DescribeAction, I18nType, inject } from "@structured-growth/microservice-sdk";

@Route("v1/ping")
@Tags("Ping")
@autoInjectable()
export class PingController extends BaseController {
	private i18n: I18nType;

	constructor(@inject("i18n") private getI18n: () => I18nType) {
		super();
		this.i18n = this.getI18n();
	}
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
			message: `${this.i18n.__("system.ping.am")} ${this.appPrefix} ${this.i18n.__("system.ping.service")}`,
		};
	}
}

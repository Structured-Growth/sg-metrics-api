import { Get, Route, Tags, Queries, SuccessResponse, OperationId } from "tsoa";
import {
	inject,
	autoInjectable,
	BaseController,
	DescribeAction,
	NotFoundError,
} from "@structured-growth/microservice-sdk";
import { App } from "../../app/app";
import * as controllers from "./index";
import { ResolveQueryParamsInterface } from "../../interfaces/resolve-query-params.interface";
import { ResolveResourceResponseInterface } from "../../interfaces/resolve-resource-response.interface";
import { ResolveActionsResponseInterface } from "../../interfaces/resolve-actions-response.interface";
import { ResolveModelsResponseInterface } from "../../interfaces/resolve-models-response.interface";

@Route("v1/resolver")
@Tags("ResolverController")
@autoInjectable()
export class ResolverController extends BaseController {
	constructor(@inject("App") private app?: App, @inject("appPrefix") private appPrefix?: string) {
		super();
	}

	/**
	 * Resolve resource's ARN
	 */
	@OperationId("Resolve resource")
	@Get("/resolve")
	@SuccessResponse(200, "Returns resolved resource")
	@DescribeAction("resolve/resource")
	async resolve(@Queries() query: ResolveQueryParamsInterface): Promise<ResolveResourceResponseInterface> {
		const { resource, ...filter } = query;
		const modelClass = this.app.models[resource];

		if (!modelClass) {
			throw new NotFoundError("Not found");
		}

		const model = await modelClass.findOne({
			where: filter,
			rejectOnEmpty: false,
		});

		if (!model) {
			throw new NotFoundError("Not found");
		}

		return {
			arn: model["arn"],
		};
	}

	/**
	 * List all microservice actions
	 */
	@OperationId("List actions")
	@Get("/actions")
	@SuccessResponse(200, "Returns actions")
	@DescribeAction("resolve/actions")
	async actions(): Promise<ResolveActionsResponseInterface> {
		const actions = [];
		const { actionToRouteMap } = require("../../routes/v1");
		for (let controller in controllers as any) {
			const prototype = Object.getPrototypeOf(controllers[controller].prototype);
			const methods = Object.getOwnPropertyNames(prototype);
			for (let method of methods) {
				const action = Reflect.getMetadata(`__action:${method}`, prototype);
				const route = actionToRouteMap[`${controller}.${method}`];
				if (action) {
					const resources =
						action.resources?.map(({ resource, arnPattern }) => {
							const modelClass = this.app.models[resource];
							arnPattern = arnPattern || modelClass?.["arnPattern"] || "external resource";
							return { resource, arnPattern };
						}) || [];
					actions.push({
						action: `${this.appPrefix}:${action.action}`,
						route,
						resources,
					});
				}
			}
		}

		return {
			data: actions,
		};
	}

	/**
	 * List all microservice models
	 */
	@OperationId("List models")
	@Get("/models")
	@SuccessResponse(200, "Returns models")
	@DescribeAction("resolve/models")
	async models(): Promise<ResolveModelsResponseInterface> {
		const models = [];
		for (let i in this.app.models) {
			models.push({
				resource: i,
				arnPattern: this.app.models[i]["arnPattern"],
			});
		}

		return {
			data: models,
		};
	}
}

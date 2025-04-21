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
	I18nType,
} from "@structured-growth/microservice-sdk";
import { pick } from "lodash";
import { MetricCategory, MetricCategoryAttributes } from "../../../database/models/metric-category.sequelize";
import { MetricCategorySearchParamsInterface } from "../../interfaces/metric-category-search-params.interface";
import { MetricCategoryCreateBodyInterface } from "../../interfaces/metric-category-create-body.interface";
import { MetricCategoryUpdateBodyInterface } from "../../interfaces/metric-category-update-body.interface";
import { MetricCategorySearchParamsValidator } from "../../validators/metric-category-search-params.validator";
import { MetricCategoryCreateParamsValidator } from "../../validators/metric-category-create-params.validator";
import { MetricCategoryUpdateSearchParamsValidator } from "../../validators/metric-category-update-params.validator";
import { MetricCategoryService } from "../../modules/metric-category/metric-category.service";
import { MetricCategoryRepository } from "../../modules/metric-category/metric-category.repository";
import { EventMutation } from "@structured-growth/microservice-sdk";

const publicMetricCategoryAttributes = [
	"id",
	"orgId",
	"region",
	"accountId",
	"title",
	"status",
	"code",
	"createdAt",
	"updatedAt",
	"arn",
] as const;
type MetricCategoryKeys = (typeof publicMetricCategoryAttributes)[number];
type PublicMetricCategoryAttributes = Pick<MetricCategoryAttributes, MetricCategoryKeys> & {
	metadata: Record<string, string>;
};
type SearchMetricCategoryAttributes = Omit<PublicMetricCategoryAttributes, "accountId">;

@Route("v1/metric-category")
@Tags("Metric Category")
@autoInjectable()
export class MetricCategoryController extends BaseController {
	private i18n: I18nType;
	constructor(
		@inject("MetricCategoryRepository") private metricCategoryRepository: MetricCategoryRepository,
		@inject("MetricCategoryService") private metricCategoryService: MetricCategoryService,
		@inject("i18n") private getI18n: () => I18nType
	) {
		super();
		this.i18n = this.getI18n();
	}

	/**
	 * Search Metric Categories records
	 */
	@OperationId("Search")
	@Get("/")
	@SuccessResponse(200, "Returns list of categories")
	@DescribeAction("metric-category/search")
	@DescribeResource("Organization", ({ query }) => Number(query.orgId))
	@DescribeResource("Account", ({ query }) => Number(query.accountId))
	@DescribeResource("MetricCategory", ({ query }) => query.id?.map(Number))
	@ValidateFuncArgs(MetricCategorySearchParamsValidator)
	async search(
		@Queries() query: MetricCategorySearchParamsInterface
	): Promise<SearchResultInterface<PublicMetricCategoryAttributes>> {
		const { data, ...result } = await this.metricCategoryService.search({
			...query,
			includeInherited: query.includeInherited?.toString() !== "false",
		});
		this.response.status(200);

		return {
			data: data.map((metricCategory) => {
				const attributes = pick(metricCategory.toJSON(), publicMetricCategoryAttributes);
				delete attributes.accountId;
				return {
					...(attributes as SearchMetricCategoryAttributes),
					metadata: metricCategory.metadata,
					arn: metricCategory.arn,
				};
			}),
			...result,
		};
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
		const metricCategory = await this.metricCategoryService.create(body);
		this.response.status(201);

		await this.eventBus.publish(
			new EventMutation(
				this.principal.arn,
				metricCategory.arn,
				`${this.appPrefix}:metric-category/create`,
				JSON.stringify(body)
			)
		);

		return {
			...(pick(metricCategory.toJSON(), publicMetricCategoryAttributes) as PublicMetricCategoryAttributes),
			metadata: metricCategory.metadata,
			arn: metricCategory.arn,
		};
	}

	/**
	 * Get MetricCategory
	 */
	@OperationId("Read")
	@Get("/:metricCategoryId")
	@SuccessResponse(200, "Returns category")
	@DescribeAction("metric-category/read")
	@DescribeResource("MetricCategory", ({ params }) => Number(params.metricCategoryId))
	async get(@Path() metricCategoryId: number): Promise<PublicMetricCategoryAttributes> {
		const metricCategory = await this.metricCategoryRepository.read(metricCategoryId);
		this.response.status(200);
		if (!metricCategory) {
			throw new NotFoundError(
				`${this.i18n.__("error.metric_category.name")} ${metricCategoryId} ${this.i18n.__("error.common.not_found")}`
			);
		}

		return {
			...(pick(metricCategory.toJSON(), publicMetricCategoryAttributes) as PublicMetricCategoryAttributes),
			metadata: metricCategory.metadata,
			arn: metricCategory.arn,
		};
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
		@Path() metricCategoryId: number,
		@Queries() query: {},
		@Body() body: MetricCategoryUpdateBodyInterface
	): Promise<PublicMetricCategoryAttributes> {
		const metricCategory = await this.metricCategoryService.update(metricCategoryId, body);
		this.response.status(200);

		await this.eventBus.publish(
			new EventMutation(
				this.principal.arn,
				metricCategory.arn,
				`${this.appPrefix}:metric-category/update`,
				JSON.stringify(body)
			)
		);

		return {
			...(pick(metricCategory.toJSON(), publicMetricCategoryAttributes) as PublicMetricCategoryAttributes),
			metadata: metricCategory.metadata,
			arn: metricCategory.arn,
		};
	}

	/**
	 * Delete Example
	 */
	@OperationId("Delete")
	@Delete("/:metricCategoryId")
	@SuccessResponse(204, "Returns nothing")
	@DescribeAction("metric-category/delete")
	@DescribeResource("MetricCategory", ({ params }) => Number(params.metricCategoryId))
	async delete(@Path() metricCategoryId: number): Promise<void> {
		const metricCategory = await this.metricCategoryRepository.read(metricCategoryId);

		if (!metricCategory) {
			throw new NotFoundError(
				`${this.i18n.__("error.metric_category.name")} ${metricCategoryId} ${this.i18n.__("error.common.not_found")}`
			);
		}
		await this.metricCategoryService.delete(metricCategoryId);

		await this.eventBus.publish(
			new EventMutation(
				this.principal.arn,
				metricCategory.arn,
				`${this.appPrefix}:metric-category/delete`,
				JSON.stringify({})
			)
		);

		this.response.status(204);
	}
}

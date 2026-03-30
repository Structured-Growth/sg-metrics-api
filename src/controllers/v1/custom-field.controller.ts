import { Body, Delete, Get, OperationId, Path, Post, Put, Queries, Route, SuccessResponse, Tags } from "tsoa";
import {
	autoInjectable,
	BaseController,
	DescribeAction,
	DescribeResource,
	EventMutation,
	I18nType,
	inject,
	NotFoundError,
	SearchResultInterface,
	ValidateFuncArgs,
} from "@structured-growth/microservice-sdk";
import { pick } from "lodash";
import { CustomFieldAttributes } from "../../../database/models/custom-field.sequelize";
import { CustomFieldCreateBodyInterface } from "../../interfaces/custom-field-create-body.interface";
import { CustomFieldSearchParamsInterface } from "../../interfaces/custom-field-search-params.interface";
import { CustomFieldUpdateBodyInterface } from "../../interfaces/custom-field-update-body.interface";
import { CustomFieldValidateBodyInterface } from "../../interfaces/custom-field-validate-body.interface";
import { CustomFieldValidateResponseInterface } from "../../interfaces/custom-field-validate-response.interface";
import { CustomFieldRepository } from "../../modules/custom-fields/custom-field.repository";
import { CustomFieldService } from "../../modules/custom-fields/custom-field.service";
import { CustomFieldCreateParamsValidator } from "../../validators/custom-field-create-params.validator";
import { CustomFieldDeleteParamsValidator } from "../../validators/custom-field-delete-params.validator";
import { CustomFieldReadParamsValidator } from "../../validators/custom-field-read-params.validator";
import { CustomFieldSearchParamsValidator } from "../../validators/custom-field-search-params.validator";
import { CustomFieldUpdateParamsValidator } from "../../validators/custom-field-update-params.validator";
import { CustomFieldValidateValidator } from "../../validators/custom-field-validate.validator";

const publicCustomFieldAttributes = [
	"id",
	"orgId",
	"region",
	"entity",
	"title",
	"name",
	"schema",
	"createdAt",
	"updatedAt",
	"status",
	"arn",
] as const;
type CustomFieldKeys = (typeof publicCustomFieldAttributes)[number];
type PublicCustomFieldAttributes = Pick<CustomFieldAttributes, CustomFieldKeys>;

@Route("v1/custom-fields")
@Tags("Custom Fields")
@autoInjectable()
export class CustomFieldsController extends BaseController {
	private i18n: I18nType;

	constructor(
		@inject("CustomFieldRepository") private customFieldRepository: CustomFieldRepository,
		@inject("CustomFieldService") private customFieldService: CustomFieldService,
		@inject("i18n") private getI18n: () => I18nType
	) {
		super();
		this.i18n = this.getI18n();
	}

	@OperationId("Search")
	@Get("/")
	@SuccessResponse(200, "Returns list of custom fields")
	@DescribeAction("custom-fields/search")
	@DescribeResource("Organization", ({ query }) => [Number(query.orgId)])
	@DescribeResource("CustomField", ({ query }) => query.id?.map(Number))
	@ValidateFuncArgs(CustomFieldSearchParamsValidator)
	async search(
		@Queries() query: CustomFieldSearchParamsInterface
	): Promise<SearchResultInterface<PublicCustomFieldAttributes>> {
		const { data, ...result } = await this.customFieldService.search(
			{
				...query,
				includeInherited: query.includeInherited?.toString() !== "false",
			},
			"orgIds" in this.principal && Array.isArray(this.principal.orgIds) ? this.principal.orgIds : []
		);

		return {
			data: data.map((customField) => ({
				...(pick(customField.toJSON(), publicCustomFieldAttributes) as PublicCustomFieldAttributes),
				arn: customField.arn,
			})),
			...result,
		};
	}

	@OperationId("Validate custom fields")
	@Post("/validate")
	@SuccessResponse(200, "Returns validation result")
	@DescribeResource("Organization", ({ body }) => [Number(body.orgId)])
	@DescribeAction("custom-fields/validate")
	@ValidateFuncArgs(CustomFieldValidateValidator)
	async validateCustomFields(
		@Queries() query: {},
		@Body() body: CustomFieldValidateBodyInterface
	): Promise<CustomFieldValidateResponseInterface> {
		return this.customFieldService.validate(
			body.entity,
			body.data,
			body.orgId,
			"orgIds" in this.principal && Array.isArray(this.principal.orgIds) ? this.principal.orgIds : [],
			false
		);
	}

	@OperationId("Create")
	@Post("/")
	@SuccessResponse(201, "Returns created custom field")
	@DescribeAction("custom-fields/create")
	@DescribeResource("Organization", ({ body }) => [Number(body.orgId)])
	@ValidateFuncArgs(CustomFieldCreateParamsValidator)
	async create(
		@Queries() query: {},
		@Body() body: CustomFieldCreateBodyInterface
	): Promise<PublicCustomFieldAttributes> {
		const customField = await this.customFieldRepository.create(body);
		this.response.status(201);

		await this.eventBus.publish(
			new EventMutation(
				this.principal.arn,
				customField.arn,
				`${this.appPrefix}:custom-fields/create`,
				JSON.stringify(body)
			)
		);

		return {
			...(pick(customField.toJSON(), publicCustomFieldAttributes) as PublicCustomFieldAttributes),
			arn: customField.arn,
		};
	}

	@OperationId("Read")
	@Get("/:customFieldId")
	@SuccessResponse(200, "Returns custom field")
	@DescribeAction("custom-fields/read")
	@DescribeResource("CustomField", ({ params }) => [Number(params.customFieldId)])
	@ValidateFuncArgs(CustomFieldReadParamsValidator)
	async get(@Path() customFieldId: number): Promise<PublicCustomFieldAttributes> {
		const customField = await this.customFieldRepository.read(customFieldId);

		if (!customField) {
			throw new NotFoundError(
				`${this.i18n.__("error.custom_field.name")} ${customFieldId} ${this.i18n.__("error.common.not_found")}`
			);
		}

		return {
			...(pick(customField.toJSON(), publicCustomFieldAttributes) as PublicCustomFieldAttributes),
			arn: customField.arn,
		};
	}

	@OperationId("Update")
	@Put("/:customFieldId")
	@SuccessResponse(200, "Returns updated custom field")
	@DescribeAction("custom-fields/update")
	@DescribeResource("CustomField", ({ params }) => [Number(params.customFieldId)])
	@ValidateFuncArgs(CustomFieldUpdateParamsValidator)
	async update(
		@Path() customFieldId: number,
		@Queries() query: {},
		@Body() body: CustomFieldUpdateBodyInterface
	): Promise<PublicCustomFieldAttributes> {
		const customField = await this.customFieldRepository.update(customFieldId, body);

		await this.eventBus.publish(
			new EventMutation(
				this.principal.arn,
				customField.arn,
				`${this.appPrefix}:custom-fields/update`,
				JSON.stringify(body)
			)
		);

		return {
			...(pick(customField.toJSON(), publicCustomFieldAttributes) as PublicCustomFieldAttributes),
			arn: customField.arn,
		};
	}

	@OperationId("Delete")
	@Delete("/:customFieldId")
	@SuccessResponse(204, "Returns nothing")
	@DescribeAction("custom-fields/delete")
	@DescribeResource("CustomField", ({ params }) => [Number(params.customFieldId)])
	@ValidateFuncArgs(CustomFieldDeleteParamsValidator)
	async delete(@Path() customFieldId: number): Promise<void> {
		const customField = await this.customFieldRepository.read(customFieldId);

		if (!customField) {
			throw new NotFoundError(
				`${this.i18n.__("error.custom_field.name")} ${customFieldId} ${this.i18n.__("error.common.not_found")}`
			);
		}

		await this.customFieldRepository.delete(customFieldId);

		await this.eventBus.publish(
			new EventMutation(
				this.principal.arn,
				customField.arn,
				`${this.appPrefix}:custom-fields/delete`,
				JSON.stringify({})
			)
		);

		this.response.status(204);
	}
}

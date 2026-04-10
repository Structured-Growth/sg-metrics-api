import {
	autoInjectable,
	inject,
	joi,
	I18nType,
	NotFoundError,
	SearchResultInterface,
	validate,
	ValidationError,
} from "@structured-growth/microservice-sdk";
import { Op } from "sequelize";
import CustomField, {
	CustomFieldCreationAttributes,
	CustomFieldUpdateAttributes,
} from "../../../database/models/custom-field.sequelize";
import { CustomFieldSearchParamsInterface } from "../../interfaces/custom-field-search-params.interface";
import { CustomFieldRepository } from "./custom-field.repository";

@autoInjectable()
export class CustomFieldService {
	private i18n: I18nType;

	constructor(
		@inject("CustomFieldRepository") private customFieldRepository: CustomFieldRepository,
		@inject("i18n") private getI18n: () => I18nType
	) {
		this.i18n = this.getI18n();
	}

	public async search(
		params: CustomFieldSearchParamsInterface,
		parentOrgIds: number[] = []
	): Promise<SearchResultInterface<CustomField>> {
		const orgIds = params.includeInherited === false ? [params.orgId] : [params.orgId, ...parentOrgIds];

		return this.customFieldRepository.search({
			...params,
			orgId: orgIds,
		});
	}

	public async validate(
		entityName: string,
		data: Record<string, unknown> | null | undefined,
		orgIds: number[] = [],
		throwError = true
	): Promise<{
		valid: boolean;
		message?: string;
		errors?: object;
	}> {
		const customFields = await CustomField.findAll({
			where: {
				entity: entityName,
				orgId: {
					[Op.or]: orgIds,
				},
			},
		});

		const validator = joi.object(
			customFields.reduce((acc, item) => {
				acc[item.name] = joi.build(item.schema);
				return acc;
			}, {})
		);

		const { valid, message, errors } = await validate(validator, data ?? {});

		if (!valid && throwError) {
			throw new ValidationError({
				body: {
					metadata: errors,
				},
			});
		}

		return { valid, message, errors };
	}

	public async create(params: CustomFieldCreationAttributes): Promise<CustomField> {
		const duplicate = await this.customFieldRepository.search({
			orgId: [params.orgId],
			entity: [params.entity],
			name: [params.name],
		});

		if (duplicate.data.length > 0) {
			throw new ValidationError({
				body: {
					name: [this.i18n.__("error.custom_field.custom_field_created")],
				},
			});
		}

		return this.customFieldRepository.create(params);
	}

	public async update(id: number, params: CustomFieldUpdateAttributes): Promise<CustomField> {
		const customField = await this.customFieldRepository.read(id);

		if (!customField) {
			throw new NotFoundError(
				`${this.i18n.__("error.custom_field.name")} ${id} ${this.i18n.__("error.common.not_found")}`
			);
		}

		const nextEntity = params.entity ?? customField.entity;
		const nextName = params.name ?? customField.name;
		const duplicate = await this.customFieldRepository.search({
			orgId: [customField.orgId],
			entity: [nextEntity],
			name: [nextName],
		});

		if (duplicate.data.some((item) => Number(item.id) !== Number(id))) {
			throw new ValidationError({
				body: {
					name: [this.i18n.__("error.custom_field.custom_field_created")],
				},
			});
		}

		return this.customFieldRepository.update(id, params);
	}
}

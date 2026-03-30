import {
	autoInjectable,
	inject,
	joi,
	SearchResultInterface,
	validate,
	ValidationError,
} from "@structured-growth/microservice-sdk";
import { Op } from "sequelize";
import CustomField from "../../../database/models/custom-field.sequelize";
import { CustomFieldSearchParamsInterface } from "../../interfaces/custom-field-search-params.interface";
import { CustomFieldRepository } from "./custom-field.repository";

@autoInjectable()
export class CustomFieldService {
	constructor(@inject("CustomFieldRepository") private customFieldRepository: CustomFieldRepository) {}

	public async search(
		params: CustomFieldSearchParamsInterface,
		inheritedOrgIds: number[] = []
	): Promise<SearchResultInterface<CustomField>> {
		const orgIds =
			params.includeInherited === false
				? [params.orgId]
				: [params.orgId, ...this.normalizeInheritedOrgIds(params.orgId, inheritedOrgIds)];

		return this.customFieldRepository.search({
			...params,
			orgId: orgIds,
		});
	}

	public async validate(
		entityName: string,
		data: Record<string, unknown> | null | undefined,
		orgId: number,
		inheritedOrgIds: number[] = [],
		throwError = true
	): Promise<{
		valid: boolean;
		message?: string;
		errors?: object;
	}> {
		const customFields = await CustomField.findAll({
			where: {
				entity: entityName,
				status: "active",
				orgId: {
					[Op.or]: [orgId, ...this.normalizeInheritedOrgIds(orgId, inheritedOrgIds)],
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

	private normalizeInheritedOrgIds(orgId: number, inheritedOrgIds: number[]): number[] {
		if (!Array.isArray(inheritedOrgIds)) {
			return [];
		}

		const normalizedOrgIds = new Set<number>();

		for (const inheritedOrgId of inheritedOrgIds) {
			const normalizedOrgId = Number(inheritedOrgId);

			if (!Number.isInteger(normalizedOrgId) || normalizedOrgId <= 0 || normalizedOrgId === orgId) {
				continue;
			}

			normalizedOrgIds.add(normalizedOrgId);
		}

		return Array.from(normalizedOrgIds);
	}
}

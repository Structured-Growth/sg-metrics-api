import { Op } from "sequelize";
import {
	autoInjectable,
	I18nType,
	inject,
	NotFoundError,
	RepositoryInterface,
	SearchResultInterface,
} from "@structured-growth/microservice-sdk";
import CustomField, { CustomFieldCreationAttributes } from "../../../database/models/custom-field.sequelize";
import { CustomFieldSearchParamsInterface } from "../../interfaces/custom-field-search-params.interface";
import { CustomFieldUpdateBodyInterface } from "../../interfaces/custom-field-update-body.interface";

type CustomFieldRepositorySearchParams = Omit<CustomFieldSearchParamsInterface, "includeInherited" | "orgId"> & {
	orgId: number[];
};

@autoInjectable()
export class CustomFieldRepository
	implements RepositoryInterface<CustomField, CustomFieldRepositorySearchParams, CustomFieldCreationAttributes>
{
	private i18n: I18nType;

	constructor(@inject("i18n") private getI18n: () => I18nType) {
		this.i18n = this.getI18n();
	}

	public async search(params: CustomFieldRepositorySearchParams): Promise<SearchResultInterface<CustomField>> {
		const page = params.page || 1;
		const limit = params.limit || 20;
		const offset = (page - 1) * limit;
		const where = {};
		const order = params.sort ? (params.sort.map((item) => item.split(":")) as any) : [["createdAt", "desc"]];

		params.orgId && (where["orgId"] = { [Op.in]: params.orgId });
		params.id && (where["id"] = { [Op.in]: params.id });
		params.entity && (where["entity"] = { [Op.in]: params.entity });
		params.status && (where["status"] = { [Op.in]: params.status });

		if (params.title?.length > 0) {
			where["title"] = {
				[Op.or]: params.title.map((str) => ({ [Op.iLike]: str.replace(/\*/g, "%") })),
			};
		}

		if (params.name?.length > 0) {
			where["name"] = {
				[Op.or]: params.name.map((str) => ({ [Op.iLike]: str.replace(/\*/g, "%") })),
			};
		}

		const { rows, count } = await CustomField.findAndCountAll({
			where,
			offset,
			limit,
			order,
		});

		return {
			data: rows,
			total: count,
			limit,
			page,
		};
	}

	public async create(params: CustomFieldCreationAttributes): Promise<CustomField> {
		return CustomField.create(params);
	}

	public async read(
		id: number,
		params?: {
			attributes?: string[];
		}
	): Promise<CustomField | null> {
		return CustomField.findByPk(id, {
			attributes: params?.attributes,
			rejectOnEmpty: false,
		});
	}

	public async update(id: number, params: CustomFieldUpdateBodyInterface): Promise<CustomField> {
		const model = await this.read(id);

		if (!model) {
			throw new NotFoundError(
				`${this.i18n.__("error.custom_field.name")} ${id} ${this.i18n.__("error.common.not_found")}`
			);
		}

		model.setAttributes(params);

		return model.save();
	}

	public async delete(id: number): Promise<void> {
		const n = await CustomField.destroy({ where: { id } });

		if (n === 0) {
			throw new NotFoundError(
				`${this.i18n.__("error.custom_field.name")} ${id} ${this.i18n.__("error.common.not_found")}`
			);
		}
	}
}

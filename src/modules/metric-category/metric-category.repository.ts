import { Op, Transaction } from "sequelize";
import {
	autoInjectable,
	RepositoryInterface,
	SearchResultInterface,
	NotFoundError,
} from "@structured-growth/microservice-sdk";
import MetricCategory, {
	MetricCategoryCreationAttributes,
	MetricCategoryUpdateAttributes,
} from "../../../database/models/metric-category.sequelize";
import { MetricCategorySearchParamsInterface } from "../../interfaces/metric-category-search-params.interface";

@autoInjectable()
export class MetricCategoryRepository
	implements RepositoryInterface<MetricCategory, MetricCategorySearchParamsInterface, MetricCategoryCreationAttributes>
{
	public async search(params: MetricCategorySearchParamsInterface): Promise<SearchResultInterface<MetricCategory>> {
		const page = params.page || 1;
		const limit = params.limit || 20;
		const offset = (page - 1) * limit;
		const where = {};
		const order = params.sort ? (params.sort.map((item) => item.split(":")) as any) : [["createdAt", "desc"]];

		params.orgId && (where["orgId"] = params.orgId);
		params.accountId && (where["accountId"] = params.accountId);
		params.status && (where["status"] = { [Op.in]: params.status });
		params.id && (where["id"] = { [Op.in]: params.id });

		if (params.title?.length > 0) {
			where["title"] = {
				[Op.or]: params.title.map((str) => ({ [Op.iLike]: str.replace(/\*/g, "%") })),
			};
		}

		if (params.code?.length > 0) {
			where["code"] = {
				[Op.or]: params.code.map((str) => ({ [Op.iLike]: str.replace(/\*/g, "%") })),
			};
		}

		// TODO search by arn with wildcards

		const { rows, count } = await MetricCategory.findAndCountAll({
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

	public async create(
		params: MetricCategoryCreationAttributes,
		{ transaction }: { transaction?: Transaction } = {}
	): Promise<MetricCategory> {
		return MetricCategory.create(params, { transaction });
	}

	public async read(
		id: number,
		params?: {
			attributes?: string[];
		}
	): Promise<MetricCategory | null> {
		return MetricCategory.findByPk(id, {
			attributes: params?.attributes,
			rejectOnEmpty: false,
		});
	}

	// pick some attributes
	public async update(id: number, params: MetricCategoryUpdateAttributes): Promise<MetricCategory> {
		const metricCategory = await this.read(id);
		metricCategory.setAttributes(params);

		return metricCategory.save();
	}

	public async delete(id: number): Promise<void> {
		const n = await MetricCategory.destroy({ where: { id } });

		if (n === 0) {
			throw new NotFoundError(`Metric Category ${id} not found`);
		}
	}
}

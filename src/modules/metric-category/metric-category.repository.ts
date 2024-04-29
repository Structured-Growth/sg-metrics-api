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
import MetricCategoryMetadata from "../../../database/models/metric-category-metadata.sequelize";

@autoInjectable()
export class MetricCategoryRepository
	implements RepositoryInterface<MetricCategory, MetricCategorySearchParamsInterface, MetricCategoryCreationAttributes>
{
	public async search(
		params: MetricCategorySearchParamsInterface & {
			metadata?: Record<string, string>;
		}
	): Promise<SearchResultInterface<MetricCategory>> {
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

		if (params.metadata && Object.keys(params.metadata).length > 0) {
			const metadataSearchQuery = Object.entries(params.metadata).map(([name, value]) => ({
				name,
				value: { [Op.iLike]: `%${value}%` }, // Adjust the operator according to your requirements
			}));

			const metadataCategories = await MetricCategoryMetadata.findAll({
				where: {
					[Op.and]: metadataSearchQuery,
				},
				attributes: ["metricCategoryId"],
				raw: true,
			});

			const metricCategoryIds = metadataCategories.map((metadata) => metadata.metricCategoryId);
			where["id"] = { [Op.in]: metricCategoryIds };
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
		params: MetricCategoryCreationAttributes & {
			metadata?: Record<string, string>;
		}
	): Promise<MetricCategory> {
		const { metadata, ...metricAttributes } = params;

		return MetricCategory.create(
			{
				...metricAttributes,
				metadata: Object.keys(metadata).map((name) => ({
					orgId: metricAttributes.orgId,
					accountId: metricAttributes.accountId,
					region: metricAttributes.region,
					name,
					value: metadata[name],
				})),
			} as any,
			{
				include: [MetricCategoryMetadata],
			}
		);
	}

	public async read(
		id: number,
		params?: {
			attributes?: string[];
			transaction?: Transaction;
			metadata?: Record<string, string>;
		}
	): Promise<(MetricCategory & { metadata?: Record<string, string> }) | null> {
		const metricCategory = await MetricCategory.findByPk(id, {
			transaction: params?.transaction,
		});

		if (!metricCategory) return null;

		if (params?.metadata) {
			const metadata = await MetricCategoryMetadata.findAll({
				where: {
					metricCategoryId: metricCategory.id,
				},
				transaction: params?.transaction,
				raw: true,
			});

			metricCategory.metadata = metadata.reduce((acc, item) => {
				acc[item.name] = item.value;
				return acc;
			}, {});
		}

		return metricCategory;
	}

	// pick some attributes
	public async update(
		id: number,
		params: MetricCategoryUpdateAttributes & {
			metadata?: Record<string, string>;
		}
	): Promise<MetricCategory> {
		return MetricCategory.sequelize.transaction(async (transaction) => {
			const metricCategory = await this.read(id, {
				transaction,
			});
			metricCategory.setAttributes(params);
			await metricCategory.save({
				transaction,
			});

			if (params.metadata) {
				await MetricCategoryMetadata.destroy({
					where: {
						metricCategoryId: metricCategory.id,
					},
					transaction,
				});
				await MetricCategoryMetadata.bulkCreate(
					Object.keys(params.metadata).map((name) => ({
						orgId: metricCategory.orgId,
						accountId: metricCategory.accountId,
						region: metricCategory.region,
						metricCategoryId: metricCategory.id,
						name,
						value: params.metadata[name],
					})),
					{
						transaction,
					}
				);
			}

			return metricCategory;
		});
	}

	public async delete(id: number): Promise<void> {
		const metricCategory = await MetricCategory.findByPk(id);
		if (!metricCategory) {
			throw new NotFoundError(`Metric Category ${id} not found`);
		}

		await MetricCategoryMetadata.destroy({
			where: {
				metricCategoryId: id,
			},
		});

		await MetricCategory.destroy({ where: { id } });
	}
}

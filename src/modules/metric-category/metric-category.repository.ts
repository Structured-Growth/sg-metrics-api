import { Op, Transaction } from "sequelize";
import {
	autoInjectable,
	RepositoryInterface,
	SearchResultInterface,
	NotFoundError,
	I18nType,
	inject,
} from "@structured-growth/microservice-sdk";
import MetricCategory, {
	MetricCategoryCreationAttributes,
	MetricCategoryUpdateAttributes,
} from "../../../database/models/metric-category.sequelize";
import { MetricCategorySearchParamsInterface } from "../../interfaces/metric-category-search-params.interface";
import MetricCategoryMetadata from "../../../database/models/metric-category-metadata.sequelize";
import MetricType from "../../../database/models/metric-type.sequelize";

interface MetricCategoryRepositorySearchParamsInterface extends Omit<MetricCategorySearchParamsInterface, "orgId"> {
	orgId?: number[];
	metadata?: Record<string, string>;
}

@autoInjectable()
export class MetricCategoryRepository
	implements
		RepositoryInterface<
			MetricCategory,
			MetricCategoryRepositorySearchParamsInterface,
			MetricCategoryCreationAttributes
		>
{
	private i18n: I18nType;
	constructor(@inject("i18n") private getI18n: () => I18nType) {
		this.i18n = this.getI18n();
	}
	public async search(
		params: MetricCategoryRepositorySearchParamsInterface,
		transaction?: Transaction
	): Promise<SearchResultInterface<MetricCategory>> {
		const page = params.page || 1;
		const limit = params.limit || 20;
		const offset = (page - 1) * limit;
		const where = {};
		const order = params.sort ? (params.sort.map((item) => item.split(":")) as any) : [["createdAt", "desc"]];

		params.orgId && (where["orgId"] = { [Op.in]: params.orgId });
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
			transaction,
		});

		await Promise.all(
			rows.map(async (category) => {
				const metadata = await MetricCategoryMetadata.findAll({
					where: {
						metricCategoryId: category.id,
					},
					raw: true,
					transaction,
				});

				category.metadata = metadata.reduce((acc, item) => {
					acc[item.name] = item.value;
					return acc;
				}, {});
			})
		);

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

		// Create the metric category
		const metricCategory = await MetricCategory.create(metricAttributes);

		// If metadata is provided, create metadata entries for the category
		if (metadata) {
			await MetricCategoryMetadata.bulkCreate(
				Object.keys(metadata).map((name) => ({
					orgId: metricCategory.orgId,
					accountId: metricCategory.accountId,
					region: metricCategory.region,
					metricCategoryId: metricCategory.id,
					name,
					value: metadata[name],
				}))
			);

			// Fetch the created metadata entries for the category
			const createdMetadata = await MetricCategoryMetadata.findAll({
				where: {
					metricCategoryId: metricCategory.id,
				},
				raw: true,
			});

			// Assign the metadata to the metricCategory object
			metricCategory.metadata = createdMetadata.reduce((acc, item) => {
				acc[item.name] = item.value;
				return acc;
			}, {});
		}

		return metricCategory;
	}

	public async read(
		id: number,
		params?: {
			attributes?: string[];
			transaction?: Transaction;
		}
	): Promise<(MetricCategory & { metadata?: Record<string, string> }) | null> {
		const metricCategory = await MetricCategory.findByPk(id, {
			transaction: params?.transaction,
		});

		if (!metricCategory) {
			throw new NotFoundError(
				`${this.i18n.__("error.metric_category.name")} ${id} ${this.i18n.__("error.common.not_found")}`
			);
		}

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
				const metadata = await MetricCategoryMetadata.findAll({
					where: {
						metricCategoryId: metricCategory.id,
					},
					transaction,
					raw: true,
				});

				metricCategory.metadata = metadata.reduce((acc, item) => {
					acc[item.name] = item.value;
					return acc;
				}, {});
			}

			return metricCategory;
		});
	}

	public async delete(id: number): Promise<void> {
		await MetricCategoryMetadata.destroy({
			where: {
				metricCategoryId: id,
			},
		});

		await MetricCategory.destroy({ where: { id } });
	}

	public async findByCode(code: string): Promise<MetricCategory | null> {
		return MetricCategory.findOne({
			where: { code },
		});
	}
}

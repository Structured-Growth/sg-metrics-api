import { Op, Transaction } from "sequelize";
import {
	autoInjectable,
	RepositoryInterface,
	SearchResultInterface,
	NotFoundError,
	I18nType,
	inject,
} from "@structured-growth/microservice-sdk";
import MetricType, {
	MetricTypeCreationAttributes,
	MetricTypeUpdateAttributes,
} from "../../../database/models/metric-type.sequelize";
import { MetricTypeSearchParamsInterface } from "../../interfaces/metric-type-search-params.interface";
import MetricTypeMetadata from "../../../database/models/metric-type-metadata.sequelize";

interface MetricTypeRepositorySearchParamsInterface extends Omit<MetricTypeSearchParamsInterface, "orgId"> {
	orgId?: number[];
	metadata?: Record<string, string>;
}

@autoInjectable()
export class MetricTypeRepository
	implements RepositoryInterface<MetricType, MetricTypeRepositorySearchParamsInterface, MetricTypeCreationAttributes>
{
	private i18n: I18nType;
	constructor(@inject("i18n") private getI18n: () => I18nType) {
		this.i18n = this.getI18n();
	}
	public async search(
		params: MetricTypeRepositorySearchParamsInterface,
		transaction?: Transaction
	): Promise<SearchResultInterface<MetricType>> {
		const page = params.page || 1;
		const limit = params.limit || 20;
		const offset = (page - 1) * limit;
		const where = {};
		const order = params.sort ? (params.sort.map((item) => item.split(":")) as any) : [["createdAt", "desc"]];

		params.orgId && (where["orgId"] = { [Op.in]: params.orgId });
		params.metricCategoryId && (where["metricCategoryId"] = params.metricCategoryId);
		params.accountId && (where["accountId"] = params.accountId);
		params.status && (where["status"] = { [Op.in]: params.status });
		params.id && (where["id"] = { [Op.in]: params.id });
		params.unit && (where["unit"] = params.unit);
		params.factor && (where["factor"] = params.factor);
		params.relatedTo && (where["relatedTo"] = params.relatedTo);
		params.version && (where["version"] = params.version);

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

			const metadataTypes = await MetricTypeMetadata.findAll({
				where: {
					[Op.and]: metadataSearchQuery,
				},
				attributes: ["metricTypeId"],
				raw: true,
				transaction,
			});

			const metricTypeIds = metadataTypes.map((metadata) => metadata.metricTypeId);
			where["id"] = { [Op.in]: metricTypeIds };
		}

		// TODO search by arn with wildcards

		const { rows, count } = await MetricType.findAndCountAll({
			where,
			offset,
			limit,
			order,
			transaction,
		});

		await Promise.all(
			rows.map(async (type) => {
				const metadata = await MetricTypeMetadata.findAll({
					where: {
						metricTypeId: type.id,
					},
					raw: true,
					transaction,
				});

				type.metadata = metadata.reduce((acc, item) => {
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
		params: MetricTypeCreationAttributes & {
			metadata?: Record<string, string>;
		}
	): Promise<MetricType> {
		const { metadata, ...metricAttributes } = params;

		// Create the metric category
		const metricType = await MetricType.create(metricAttributes);

		// If metadata is provided, create metadata entries for the category
		if (metadata) {
			await MetricTypeMetadata.bulkCreate(
				Object.keys(metadata).map((name) => ({
					orgId: metricType.orgId,
					accountId: metricType.accountId,
					region: metricType.region,
					metricCategoryId: metricType.metricCategoryId,
					metricTypeId: metricType.id,
					name,
					value: metadata[name],
				}))
			);

			// Fetch the created metadata entries for the category
			const createdMetadata = await MetricTypeMetadata.findAll({
				where: {
					metricTypeId: metricType.id,
				},
				raw: true,
			});

			// Assign the metadata to the metricCategory object
			metricType.metadata = createdMetadata.reduce((acc, item) => {
				acc[item.name] = item.value;
				return acc;
			}, {});
		}

		return metricType;
	}

	public async read(
		id: number,
		params?: {
			attributes?: string[];
			transaction?: Transaction;
			metadata?: Record<string, string>;
		}
	): Promise<(MetricType & { metadata?: Record<string, string> }) | null> {
		const metricType = await MetricType.findByPk(id, {
			transaction: params?.transaction,
		});

		if (!metricType) {
			throw new NotFoundError(
				`${this.i18n.__("error.metric_type.name")} ${id} ${this.i18n.__("error.common.not_found")}`
			);
		}

		const metadata = await MetricTypeMetadata.findAll({
			where: {
				metricTypeId: metricType.id,
			},
			transaction: params?.transaction,
			raw: true,
		});

		metricType.metadata = metadata.reduce((acc, item) => {
			acc[item.name] = item.value;
			return acc;
		}, {});

		return metricType;
	}

	public async update(
		id: number,
		params: MetricTypeUpdateAttributes & {
			metadata?: Record<string, string>;
		}
	): Promise<MetricType> {
		return MetricType.sequelize.transaction(async (transaction) => {
			const metricType = await this.read(id, {
				transaction,
			});
			metricType.setAttributes(params);
			await metricType.save({
				transaction,
			});

			if (params.metadata) {
				await MetricTypeMetadata.destroy({
					where: {
						metricTypeId: metricType.id,
					},
					transaction,
				});
				await MetricTypeMetadata.bulkCreate(
					Object.keys(params.metadata).map((name) => ({
						orgId: metricType.orgId,
						accountId: metricType.accountId,
						region: metricType.region,
						metricCategoryId: metricType.metricCategoryId,
						metricTypeId: metricType.id,
						name,
						value: params.metadata[name],
					})),
					{
						transaction,
					}
				);
				const metadata = await MetricTypeMetadata.findAll({
					where: {
						metricTypeId: metricType.id,
					},
					transaction,
					raw: true,
				});

				metricType.metadata = metadata.reduce((acc, item) => {
					acc[item.name] = item.value;
					return acc;
				}, {});
			}

			return metricType;
		});
	}

	public async delete(id: number): Promise<void> {
		await MetricTypeMetadata.destroy({
			where: {
				metricTypeId: id,
			},
		});

		await MetricType.destroy({ where: { id } });
	}

	public async findByCode(code: string): Promise<MetricType | null> {
		return MetricType.findOne({
			where: { code },
		});
	}
}

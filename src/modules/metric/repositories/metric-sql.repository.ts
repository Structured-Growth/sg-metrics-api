import {
	autoInjectable,
	NotFoundError,
	SearchResultInterface,
	ValidationError,
	I18nType,
	inject,
} from "@structured-growth/microservice-sdk";
import MetricSQL from "../../../../database/models/metric-sql.sequelize";
import { MetricSearchParamsInterface } from "../../../interfaces/metric-search-params.interface";
import { MetricCreationAttributes, MetricUpdateAttributes } from "../../../../database/models/metric";
import { Op, Transaction } from "sequelize";
import { isUndefined, omitBy, round, snakeCase } from "lodash";
import { MetricAggregateParamsInterface } from "../../../interfaces/metric-aggregate-params.interface";
import { MetricAggregateResultInterface } from "../../../interfaces/metric-aggregate-result.interface";
import { Sequelize } from "sequelize-typescript";

@autoInjectable()
export class MetricSqlRepository {
	private i18n: I18nType;
	constructor(@inject("i18n") private getI18n: () => I18nType) {
		this.i18n = this.getI18n();
	}
	public async search(params: MetricSearchParamsInterface): Promise<SearchResultInterface<MetricSQL>> {
		const { where, offset, limit, page, order } = this.buildQuery(params);

		const { rows, count } = await MetricSQL.findAndCountAll({
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

	public async aggregate(
		params: MetricAggregateParamsInterface & { page?: number; limit?: number; sort?: any }
	): Promise<MetricAggregateResultInterface> {
		const { where, offset, limit, page, order } = this.buildQuery(params);

		const data = await MetricSQL.findAll({
			attributes: [
				[Sequelize.fn("max", Sequelize.col("metric_type_id")), "metricTypeId"],
				params.rowAggregation !== "count"
					? [Sequelize.fn("count", Sequelize.col(snakeCase(params.row))), "count"]
					: null,
				[Sequelize.fn(params.rowAggregation, Sequelize.col(snakeCase(params.row))), params.rowAggregation],
				params.column === "takenAt"
					? [
							Sequelize.literal(`date_bin('${params.columnAggregation}', "taken_at", TIMESTAMP '2001-01-01')`),
							"takenAt",
					  ]
					: [Sequelize.fn("min", Sequelize.col("taken_at")), "takenAt"],
				params.column !== "takenAt"
					? [Sequelize.fn("min", Sequelize.col(snakeCase(params.column))), params.column]
					: null,
				[Sequelize.fn("min", Sequelize.col("taken_at_offset")), "takenAtOffset"],
				[Sequelize.fn("min", Sequelize.col("recorded_at")), "recordedAt"],
			].filter((i) => !!i) as any,
			where,
			offset,
			limit,
			order,
			group: [params.column === "takenAt" ? params.column : snakeCase(params.column), "metric_type_id"],
			raw: true,
		});

		return {
			data: data.map((item: any) => ({
				...item,
				count: Number(item.count),
				avg: item.avg !== undefined && item.avg !== null ? round(item.avg, 2) : undefined,
				stddev_pop: item.stddev_pop !== undefined && item.stddev_pop !== null ? round(item.stddev_pop, 2) : undefined,
			})) as any,
			limit,
			page,
			total: null,
		};
	}

	public async create(params: MetricCreationAttributes[], transaction?: Transaction): Promise<MetricSQL[]> {
		try {
			return await MetricSQL.bulkCreate(params, { transaction });
		} catch (e) {
			if (e.name === "SequelizeUniqueConstraintError") {
				throw new ValidationError({}, this.i18n.__("error.metric.exists"));
			} else {
				throw e;
			}
		}
	}

	public async read(
		id: string,
		params?: {
			attributes?: string[];
			transaction?: Transaction;
		}
	): Promise<MetricSQL | null> {
		return MetricSQL.findOne({
			attributes: params?.attributes,
			where: {
				id,
				isDeleted: false,
			},
			rejectOnEmpty: false,
			transaction: params?.transaction,
		});
	}

	public async update(id: string, params: MetricUpdateAttributes, transaction?: Transaction): Promise<MetricSQL> {
		const metricAurora = await this.read(id, { transaction });
		if (!metricAurora) {
			throw new NotFoundError(`${this.i18n.__("error.metric.name")} ${id} ${this.i18n.__("error.common.not_found")}`);
		}
		metricAurora.setAttributes(params);

		return metricAurora.save({ transaction });
	}

	public async delete(id: string, transaction?: Transaction): Promise<void> {
		const metricAurora = await this.read(id, { transaction });
		if (!metricAurora) {
			throw new NotFoundError(`${this.i18n.__("error.metric.name")} ${id} ${this.i18n.__("error.common.not_found")}`);
		}
		metricAurora.isDeleted = true;

		await metricAurora.save({ transaction });
	}

	private buildQuery(params: MetricSearchParamsInterface) {
		const page = Number(params.page || 1);
		const limit = Number(params.limit || 20);
		const offset = (page - 1) * limit;
		const where = {
			isDeleted: false,
		};
		const order = params.sort ? (params.sort.map((item) => item.split(":")) as any) : [["takenAt", "desc"]];

		if (params.id?.length > 0) {
			where["id"] = {
				[Op.or]: params.id.map((str) => ({ [Op.iLike]: str.replace(/\*/g, "%") })),
			};
		}
		params.orgId && (where["orgId"] = params.orgId);
		params.accountId && (where["accountId"] = { [Op.in]: params.accountId });
		params.metricCategoryId && (where["metricCategoryId"] = params.metricCategoryId);
		params.metricTypeId && (where["metricTypeId"] = { [Op.in]: params.metricTypeId });
		params.metricTypeVersion && (where["metricTypeVersion"] = params.metricTypeVersion);
		params.userId && (where["userId"] = { [Op.in]: params.userId });
		params.relatedToRn && (where["relatedToRn"] = params.relatedToRn);
		params.deviceId && (where["deviceId"] = params.deviceId);
		params.batchId && (where["batchId"] = params.batchId);

		(params.value || params.valueMin || params.valueMax) &&
			(where["value"] = omitBy(
				{
					[Op.eq]: params.value,
					[Op.gte]: params.valueMin,
					[Op.lte]: params.valueMax,
				},
				isUndefined
			));

		(params.takenAtMin || params.takenAtMax) &&
			(where["takenAt"] = omitBy(
				{
					[Op.gte]: params.takenAtMin,
					[Op.lte]: params.takenAtMax,
				},
				isUndefined
			));

		(params.recordedAtMin || params.recordedAtMax) &&
			(where["recordedAt"] = omitBy(
				{
					[Op.gte]: params.recordedAtMin,
					[Op.lte]: params.recordedAtMax,
				},
				isUndefined
			));

		return { where, page, limit, offset, order };
	}
}

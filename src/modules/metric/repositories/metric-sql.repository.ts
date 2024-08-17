import { autoInjectable, SearchResultInterface, NotFoundError } from "@structured-growth/microservice-sdk";
import MetricSQL from "../../../../database/models/metric-sql.sequelize";
import { MetricSearchParamsInterface } from "../../../interfaces/metric-search-params.interface";
import { MetricCreationAttributes, MetricUpdateAttributes } from "../../../../database/models/metric";
import { Op } from "sequelize";
import { isUndefined, map, omitBy, round, snakeCase, sum } from "lodash";
import { MetricAggregateParamsInterface } from "../../../interfaces/metric-aggregate-params.interface";
import { MetricAggregateResultInterface } from "../../../interfaces/metric-aggregate-result.interface";
import { Sequelize } from "sequelize-typescript";

@autoInjectable()
export class MetricSqlRepository {
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
				avg: item.avg ? round(item.avg, 2) : undefined,
			})) as any,
			limit,
			page,
			total: null,
		};
	}

	public async create(params: MetricCreationAttributes[]): Promise<MetricSQL[]> {
		return MetricSQL.bulkCreate(params);
	}

	public async read(
		id: string,
		params?: {
			attributes?: string[];
		}
	): Promise<MetricSQL | null> {
		return MetricSQL.findOne({
			attributes: params?.attributes,
			where: {
				id,
				isDeleted: false,
			},
			rejectOnEmpty: false,
		});
	}

	public async update(id: string, params: MetricUpdateAttributes): Promise<MetricSQL> {
		const metricAurora = await this.read(id);
		if (!metricAurora) {
			throw new NotFoundError(`Metric SQL ${id} not found`);
		}
		metricAurora.setAttributes(params);

		return metricAurora.save();
	}

	public async delete(id: string): Promise<void> {
		const metricAurora = await this.read(id);
		if (!metricAurora) {
			throw new NotFoundError(`Metric SQL ${id} not found`);
		}
		metricAurora.isDeleted = true;

		await metricAurora.save();
	}

	private buildQuery(params: MetricSearchParamsInterface) {
		const page = Number(params.page || 1);
		const limit = Number(params.limit || 20);
		const offset = (page - 1) * limit;
		const where = {
			isDeleted: false,
		};
		const order = params.sort ? (params.sort.map((item) => item.split(":")) as any) : [["takenAt", "desc"]];

		params.id && (where["id"] = { [Op.in]: params.id });
		params.orgId && (where["orgId"] = params.orgId);
		params.accountId && (where["accountId"] = { [Op.in]: params.accountId });
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

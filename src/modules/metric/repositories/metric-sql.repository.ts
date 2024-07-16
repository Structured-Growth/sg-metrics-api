import { autoInjectable, SearchResultInterface, NotFoundError } from "@structured-growth/microservice-sdk";
import MetricSQL from "../../../../database/models/metric-sql.sequelize";
import { MetricSearchParamsInterface } from "../../../interfaces/metric-search-params.interface";
import { MetricCreationAttributes, MetricUpdateAttributes } from "../../../../database/models/metric";

@autoInjectable()
export class MetricSqlRepository {
	public async search(params: MetricSearchParamsInterface): Promise<SearchResultInterface<MetricSQL>> {
		throw new Error("Not implemented");
	}

	public async create(params: MetricCreationAttributes[]): Promise<MetricSQL[]> {
		return await MetricSQL.bulkCreate(params);
	}

	public async read(
		id: string,
		params?: {
			attributes?: string[];
		}
	): Promise<MetricSQL | null> {
		return MetricSQL.findByPk(id, {
			attributes: params?.attributes,
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
}

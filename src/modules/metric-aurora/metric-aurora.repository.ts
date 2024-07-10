import {
	autoInjectable,
	RepositoryInterface,
	SearchResultInterface,
	NotFoundError,
} from "@structured-growth/microservice-sdk";
import MetricAurora, {
	MetricAuroraCreationAttributes,
	MetricAuroraUpdateAttributes,
} from "../../../database/models/metric-aurora.sequelize";
import { MetricSearchParamsInterface } from "../../interfaces/metric-search-params.interface";

@autoInjectable()
export class MetricAuroraRepository
	implements RepositoryInterface<MetricAurora, MetricSearchParamsInterface, MetricAuroraCreationAttributes>
{
	public async search(params: MetricSearchParamsInterface): Promise<SearchResultInterface<MetricAurora>> {
		return {
			data: [],
			total: 0,
			limit: params.limit || 20,
			page: 1,
		};
	}

	public async create(params: MetricAuroraCreationAttributes): Promise<MetricAurora> {
		return await MetricAurora.create(params);
	}

	public async read(id: number): Promise<MetricAurora | null> {
		return null;
	}

	public async update(id: number, params: MetricAuroraUpdateAttributes): Promise<MetricAurora> {
		const metricAurora = await this.read(id);

		if (!metricAurora) {
			throw new NotFoundError(`MetricAurora ${id} not found`);
		}
		metricAurora.setAttributes(params);

		return metricAurora.save();
	}

	public async delete(id: number): Promise<void> {
		const metricAurora = await this.read(id);

		if (!metricAurora) {
			throw new NotFoundError(`MetricAurora ${id} not found`);
		}

		metricAurora.isDeleted = true;

		await metricAurora.save();
	}
}

import {
	autoInjectable,
	RepositoryInterface,
	SearchResultInterface,
	NotFoundError,
} from "@structured-growth/microservice-sdk";
import MetricAurora, {
	MetricAuroraCreationAttributes,
	MetricAuroraUpdateAttributes,
} from "../../../../database/models/metric-aurora.sequelize";
import { MetricSearchParamsInterface } from "../../../interfaces/metric-search-params.interface";

@autoInjectable()
export class MetricAuroraRepository {
	public async search(params: MetricSearchParamsInterface): Promise<SearchResultInterface<MetricAurora>> {
		throw new Error("Not implemented");
	}

	public async create(params: MetricAuroraCreationAttributes[]): Promise<MetricAurora[]> {
		return await MetricAurora.bulkCreate(params);
	}

	public async read(id: string): Promise<MetricAurora | null> {
		throw new Error("Not implemented");
	}

	public async update(id: string, params: MetricAuroraUpdateAttributes): Promise<MetricAurora> {
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

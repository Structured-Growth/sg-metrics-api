import { inject } from "@structured-growth/microservice-sdk/.dist";
import { MetricTimestreamRepository } from "./repositories/metric-timestream.repository";
import { MetricAuroraRepository } from "./repositories/metric-aurora.repository";
import { v4 } from "uuid";
import { Metric, MetricAttributes } from "./models/metric";
import { SearchResultInterface } from "@structured-growth/microservice-sdk";

export class MetricService {
	constructor(
		@inject("MetricRepository") private metricRepository: MetricTimestreamRepository,
		@inject("MetricAuroraRepository") private metricAuroraRepository: MetricAuroraRepository
	) {}

	public async create(data): Promise<Metric[]> {
		data = {
			id: v4(),
			recordedAt: new Date(),
			...data,
		};

		const result = await Promise.all([
			this.metricRepository.create(data), // MetricTimestream
			this.metricAuroraRepository.create(data)] // MetricAurora
		);

		return [new Metric({
			...result[0]
		})]
	}

	public async search(): Promise<SearchResultInterface<MetricAttributes>> {}

	public async read() {}

	public async update() {}

	public async delete() {}
}

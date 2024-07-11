import { inject, SearchResultInterface } from "@structured-growth/microservice-sdk/.dist";
import { MetricTimestreamRepository } from "./repositories/metric-timestream.repository";
import { MetricSqlRepository } from "./repositories/metric-sql.repository";
import { v4 } from "uuid";
import { Metric, MetricAttributes, MetricUpdateAttributes } from "../../../database/models/metric";
import { MetricCreateBodyInterface } from "../../interfaces/metric-create-body.interface";
import { MetricSearchParamsInterface } from "../../interfaces/metric-search-params.interface";

export class MetricService {
	constructor(
		@inject("MetricTimetreamRepository") private metricTimestreamRepository: MetricTimestreamRepository,
		@inject("MetricSqlRepository") private metricSqlRepository: MetricSqlRepository
	) {}

	public async create(params: MetricCreateBodyInterface[]): Promise<Metric[]> {
		const data = params.map((param) => ({
			...param,
			id: v4(),
			recordedAt: new Date(),
			isDeleted: false,
		}));

		const result = await Promise.all([
			this.metricTimestreamRepository.create(data),
			this.metricSqlRepository.create(data),
		]);

		return result[0];
	}

	public async search(params: MetricSearchParamsInterface & {}): Promise<
		Omit<SearchResultInterface<Metric>, "page" | "total"> & {
			nextToken?: string;
		}
	> {
		return await this.metricTimestreamRepository.search(params);
	}

	public async read(id: string): Promise<Metric | null> {
		return await this.metricTimestreamRepository.read(id);
	}

	public async update(id: string, params: MetricUpdateAttributes): Promise<Metric> {
		const result = await Promise.all([
			this.metricTimestreamRepository.update(id, params),
			this.metricSqlRepository.update(id, params),
		]);

		return result[0];
	}

	public async delete(id: string): Promise<void> {
		await Promise.all([this.metricTimestreamRepository.delete(id), this.metricSqlRepository.delete(id)]);
	}
}

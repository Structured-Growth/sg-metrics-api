import { autoInjectable, inject, NotFoundError, SearchResultInterface } from "@structured-growth/microservice-sdk";
import { v4 } from "uuid";
import { MetricTimestreamRepository } from "./repositories/metric-timestream.repository";
import { MetricSqlRepository } from "./repositories/metric-sql.repository";
import { Metric, MetricUpdateAttributes } from "../../../database/models/metric";
import { MetricCreateBodyInterface } from "../../interfaces/metric-create-body.interface";
import { MetricSearchParamsInterface } from "../../interfaces/metric-search-params.interface";
import { MetricAggregateParamsInterface } from "../../interfaces/metric-aggregate-params.interface";
import { MetricAggregateResultInterface } from "../../interfaces/metric-aggregate-result.interface";
import { snakeCase } from "lodash";

@autoInjectable()
export class MetricService {
	constructor(
		@inject("MetricTimestreamRepository") private metricTimestreamRepository: MetricTimestreamRepository,
		@inject("MetricSqlRepository") private metricSqlRepository: MetricSqlRepository
	) {}

	public async create(params: MetricCreateBodyInterface[]): Promise<Metric[]> {
		const data = params.map((param) => ({
			...param,
			id: v4(),
			recordedAt: new Date(),
			isDeleted: false,
		}));

		const result = await this.metricSqlRepository.create(data);
		// const result = await Promise.all([
		// 	this.metricTimestreamRepository.create(data),
		// 	this.metricSqlRepository.create(data),
		// ]);

		return result.map((item) => new Metric(item.toJSON()));
	}

	public async search(params: MetricSearchParamsInterface & {}): Promise<
		Omit<SearchResultInterface<Metric>, "page" | "total"> & {
			nextToken?: string;
		}
	> {
		return await this.metricSqlRepository.search(params);
	}

	public async aggregate(
		params: MetricAggregateParamsInterface & { page?: number; limit?: number; sort?: any }
	): Promise<MetricAggregateResultInterface> {
		if (params.column === "time") {
			params.column = "takenAt";
		}
		if (params.row === "time") {
			params.row = "takenAt";
		}

		return await this.metricSqlRepository.aggregate(params);
	}

	public async read(id: string): Promise<Metric | null> {
		const metric = await this.metricSqlRepository.read(id);
		if (!metric) {
			throw new NotFoundError(`Metric ${id} not found`);
		}

		return new Metric(metric.toJSON());
	}

	public async update(id: string, params: MetricUpdateAttributes): Promise<Metric> {
		const result = await Promise.all([
			// this.metricTimestreamRepository.update(id, params),
			this.metricSqlRepository.update(id, params),
		]);

		return new Metric(result[0].toJSON());
	}

	public async delete(id: string): Promise<void> {
		// await Promise.all([this.metricTimestreamRepository.delete(id), this.metricSqlRepository.delete(id)]);
		await this.metricSqlRepository.delete(id);
	}
}

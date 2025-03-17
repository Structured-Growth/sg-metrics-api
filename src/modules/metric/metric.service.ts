import {
	autoInjectable,
	EventbusService,
	inject,
	NotFoundError,
	SearchResultInterface,
} from "@structured-growth/microservice-sdk";
import { v4 } from "uuid";
import { MetricTimestreamRepository } from "./repositories/metric-timestream.repository";
import { MetricSqlRepository } from "./repositories/metric-sql.repository";
import { Metric, MetricCreationAttributes, MetricUpdateAttributes } from "../../../database/models/metric";
import { MetricCreateBodyInterface } from "../../interfaces/metric-create-body.interface";
import { MetricSearchParamsInterface } from "../../interfaces/metric-search-params.interface";
import { MetricAggregateParamsInterface } from "../../interfaces/metric-aggregate-params.interface";
import { MetricAggregateResultInterface } from "../../interfaces/metric-aggregate-result.interface";
import { keyBy, map, omit, snakeCase, uniq } from "lodash";
import { MetricTypeRepository } from "../metric-type/metric-type.repository";
import MetricType from "../../../database/models/metric-type.sequelize";
import { MetricCategoryRepository } from "../metric-category/metric-category.repository";
import { MetricsBulkRequestInterface } from "../../interfaces/metrics-bulk.request.interface";
import MetricSQL from "../../../database/models/metric-sql.sequelize";
import { Transaction } from "sequelize";

@autoInjectable()
export class MetricService {
	constructor(
		@inject("MetricTimestreamRepository") private metricTimestreamRepository: MetricTimestreamRepository,
		@inject("MetricSqlRepository") private metricSqlRepository: MetricSqlRepository,
		@inject("MetricCategoryRepository") private metricCategoryRepository: MetricCategoryRepository,
		@inject("MetricTypeRepository") private metricTypeRepository: MetricTypeRepository,
		@inject("EventbusService") private eventBus: EventbusService,
		@inject("appPrefix") private appPrefix: string
	) {}

	public async create(params: MetricCreateBodyInterface[], transaction?: Transaction): Promise<Metric[]> {
		// check if there are metrics with metricTypeCode and populate them with metricTypeId and metricCategoryId
		const metricTypeCodes = map(params, "metricTypeCode").filter((i) => !!i);
		let metricTypesMap: Record<string, MetricType> = {};
		if (metricTypeCodes.length) {
			const metricTypes = await this.metricTypeRepository.search(
				{
					code: metricTypeCodes,
				},
				transaction
			);
			metricTypesMap = keyBy(metricTypes.data, "code");
		}

		const data: MetricCreationAttributes[] = params.map((param) => {
			return {
				...param,
				metricCategoryId: param.metricCategoryId || metricTypesMap[param.metricTypeCode]?.metricCategoryId,
				metricTypeId: param.metricTypeId || metricTypesMap[param.metricTypeCode]?.id,
				id: param.id || v4(),
				recordedAt: new Date(),
				isDeleted: false,
				metadata: param.metadata || {},
			};
		});

		if (!data.length) {
			return [];
		}

		const result = await this.metricSqlRepository.create(data, transaction);

		await this.eventBus.publish({
			arn: `${this.appPrefix}:${data[0].region}:${data[0].orgId}:${data[0].accountId}:events/metrics/created`,
			data: {
				metrics: result.map((metric) => metric.toJSON()),
			},
		});

		return result.map((item) => new Metric(item.toJSON()));
	}

	public async search(params: MetricSearchParamsInterface & {}): Promise<
		SearchResultInterface<Metric> & {
			nextToken?: string;
		}
	> {
		// get metric category id by its code, if provided
		if (params.metricCategoryCode) {
			const metricCategory = await this.metricCategoryRepository.findByCode(params.metricCategoryCode);
			if (metricCategory) {
				console.log(metricCategory, metricCategory.id);
				params.metricCategoryId = metricCategory.id;
			}
		}

		// get metric type ids by theirs codes, if provided
		if (params.metricTypeCode?.length > 0) {
			const metricTypes = await this.metricTypeRepository.search({
				code: params.metricTypeCode,
			});
			const metricTypesIds = map(metricTypes.data, "id");
			params.metricTypeId = uniq([...(params.metricTypeId || []), ...metricTypesIds]);
		}

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

		// get metric category id by its code, if provided
		if (params.metricCategoryCode) {
			const metricCategory = await this.metricCategoryRepository.findByCode(params.metricCategoryCode);
			if (metricCategory) {
				params.metricCategoryId = metricCategory.id;
			}
		}

		// get metric type ids by theirs codes, if provided
		if (params.metricTypeCode?.length > 0) {
			const metricTypes = await this.metricTypeRepository.search({
				code: params.metricTypeCode,
			});
			const metricTypesIds = map(metricTypes.data, "id");
			params.metricTypeId = uniq([...(params.metricTypeId || []), ...metricTypesIds]);
		}

		return await this.metricSqlRepository.aggregate(params);
	}

	public async read(id: string, transaction?: Transaction): Promise<Metric | null> {
		const metric = await this.metricSqlRepository.read(id, { transaction });
		if (!metric) {
			throw new NotFoundError(`Metric ${id} not found`);
		}

		return new Metric(metric.toJSON());
	}

	public async update(
		id: string,
		params: MetricUpdateAttributes & { metricTypeCode?: string; metricTypeVersion?: number },
		transaction?: Transaction
	): Promise<Metric> {
		const { metricTypeCode, metricTypeVersion, ...updateParams } = params;
		let metricTypeId;

		if (metricTypeCode && metricTypeVersion) {
			const metricType = await this.metricTypeRepository.search({ code: [metricTypeCode] }, transaction);

			metricTypeId = metricType?.data?.[0]?.id;
			if (!metricTypeId) {
				throw new NotFoundError(`Metric type ${metricTypeCode} not found`);
			}
		}

		const updatedMetric = await this.metricSqlRepository.update(
			id,
			{
				...updateParams,
				...(metricTypeId && { metricTypeId }),
				...(metricTypeVersion && { metricTypeVersion }),
			},
			transaction
		);

		return new Metric(updatedMetric.toJSON());
	}

	public async delete(id: string, transaction?: Transaction): Promise<void> {
		await this.metricSqlRepository.delete(id, transaction);
	}

	public async bulk(data: MetricsBulkRequestInterface, principalArn: string): Promise<void> {
		await MetricSQL.sequelize.transaction(async (transaction) => {
			for (let operation of data) {
				switch (operation.op) {
					case "create":
						await this.create([operation.data] as any, transaction);
						break;
					case "update":
						await this.update(operation.data.id, omit(operation.data, "id") as any, transaction);
						break;
					case "delete":
						await this.delete(operation.data as string, transaction);
						break;
				}
			}
		});
	}
}

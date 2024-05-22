import { autoInjectable, inject, NotFoundError, ValidationError } from "@structured-growth/microservice-sdk";
import MetricType, { MetricTypeUpdateAttributes } from "../../../database/models/metric-type.sequelize";
import { MetricTypeCreateBodyInterface } from "../../interfaces/metric-type-create-body.interface";
import { MetricTypeUpdateBodyInterface } from "../../interfaces/metric-type-update-body.interface";
import { MetricTypeRepository } from "./metric-type.repository";
import { MetricCategoryRepository } from "../metric-category/metric-category.repository";
import { MetricRepository } from "../metric/metric.repository";
import { isUndefined, omitBy } from "lodash";

@autoInjectable()
export class MetricTypeService {
	constructor(
		@inject("MetricTypeRepository") private metricTypeRepository: MetricTypeRepository,
		@inject("MetricCategoryRepository") private metricCategoryRepository: MetricCategoryRepository,
		@inject("MetricRepository") private metricRepository: MetricRepository
	) {}

	public async create(params: MetricTypeCreateBodyInterface): Promise<MetricType> {
		if (params.metricCategoryId) {
			const checkMetricCategoryId = await this.metricCategoryRepository.read(params.metricCategoryId);
			if (!checkMetricCategoryId) {
				throw new NotFoundError(`Metric Category ${params.metricCategoryId} not found`);
			}
		}
		const existingMetricType = await this.metricTypeRepository.findByCode(params.code);
		if (existingMetricType) {
			throw new ValidationError(
				{ code: `Metric Type with code ${params.code} already exists` },
				`Metric Type with code ${params.code} already exists`
			);
		}

		return this.metricTypeRepository.create({
			orgId: params.orgId,
			region: params.region,
			accountId: params.accountId,
			metricCategoryId: params.metricCategoryId,
			title: params.title,
			code: params.code,
			unit: params.unit,
			factor: params.factor,
			relatedTo: params.relatedTo,
			version: params.version,
			status: params.status || "inactive",
			metadata: params.metadata,
		});
	}

	public async update(metricTypeId, params: MetricTypeUpdateBodyInterface): Promise<MetricType> {
		const checkMetricTypeId = await this.metricTypeRepository.read(metricTypeId);
		if (!checkMetricTypeId) {
			throw new NotFoundError(`Metric Type ${metricTypeId} not found`);
		}
		const existingMetricType = await this.metricTypeRepository.findByCode(params.code);
		if (existingMetricType) {
			throw new ValidationError(
				{ code: `Metric Type with code ${params.code} already exists` },
				`Metric Type with code ${params.code} already exists`
			);
		}
		return this.metricTypeRepository.update(
			metricTypeId,
			omitBy(
				{
					accountId: params.accountId,
					metricCategoryId: params.metricCategoryId,
					title: params.title,
					code: params.code,
					unit: params.unit,
					factor: params.factor,
					relatedTo: params.relatedTo,
					version: params.version,
					status: params.status,
					metadata: params.metadata,
				},
				isUndefined
			) as MetricTypeUpdateAttributes
		);
	}
	public async delete(metricTypeId: number): Promise<void> {
		const metricType = await this.metricTypeRepository.read(metricTypeId);

		if (!metricType) {
			throw new NotFoundError(`Metric Type ${metricTypeId} not found`);
		}
		const orgId = metricType.orgId;
		const associatedMetric = await this.metricRepository.search({ orgId, metricTypeId });
		if (associatedMetric.data.length > 0) {
			throw new ValidationError(
				{ code: `Metric Type ${metricTypeId} cannot be deleted as it has associated Metric` },
				`Metric Type ${metricTypeId} cannot be deleted as it has associated Metric`
			);
		}

		await this.metricCategoryRepository.delete(metricTypeId);
	}
}

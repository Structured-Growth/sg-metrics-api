import { autoInjectable, inject, NotFoundError } from "@structured-growth/microservice-sdk";
import MetricCategory, { MetricCategoryUpdateAttributes } from "../../../database/models/metric-category.sequelize";
import { MetricCategoryCreateBodyInterface } from "../../interfaces/metric-category-create-body.interface";
import { MetricCategoryUpdateBodyInterface } from "../../interfaces/metric-category-update-body.interface";
import { MetricCategoryRepository } from "./metric-category.repository";
import { MetricTypeRepository } from "../metric-type/metric-type.repository";
import { isUndefined, omit, omitBy } from "lodash";
import { ValidationError } from "@structured-growth/microservice-sdk";
import { SearchResultInterface, signedInternalFetch } from "@structured-growth/microservice-sdk";
import { MetricCategorySearchParamsInterface } from "../../interfaces/metric-category-search-params.interface";

@autoInjectable()
export class MetricCategoryService {
	constructor(
		@inject("MetricCategoryRepository") private metricCategoryRepository: MetricCategoryRepository,
		@inject("MetricTypeRepository") private metricTypeRepository: MetricTypeRepository,
		@inject("accountApiUrl") private accountApiUrl: string
	) {}

	public async search(
		params: MetricCategorySearchParamsInterface & {
			metadata?: Record<string, string>;
		}
	): Promise<SearchResultInterface<MetricCategory>> {
		if (params.includeInherited) {
			const response = await signedInternalFetch(`${this.accountApiUrl}/v1/organizations/${params.orgId}/parents`);
			const organizations: object[] = (await response.json()) as any;
			const orgIds: number[] = organizations.map((org) => org["id"]);

			return this.metricCategoryRepository.search({
				...omit(params, "includeInherited", "orgId"),
				orgId: [params.orgId, ...orgIds],
			});
		} else {
			return this.metricCategoryRepository.search({
				...omit(params, "includeInherited", "orgId"),
				orgId: [params.orgId],
			});
		}
	}

	public async create(params: MetricCategoryCreateBodyInterface): Promise<MetricCategory> {
		const existingMetricCategory = await this.metricCategoryRepository.findByCode(params.code);
		if (existingMetricCategory) {
			throw new ValidationError(
				{ code: `Metric Category with code ${params.code} already exists` },
				`Metric Category with code ${params.code} already exists`
			);
		}
		const metricCategory = await this.metricCategoryRepository.create({
			orgId: params.orgId,
			region: params.region,
			title: params.title,
			code: params.code,
			status: params.status || "inactive",
			metadata: params.metadata,
		});

		return metricCategory;
	}

	public async update(metricCategoryId: any, params: MetricCategoryUpdateBodyInterface): Promise<MetricCategory> {
		const metricCategory = await this.metricCategoryRepository.read(metricCategoryId);
		if (!metricCategory) {
			throw new NotFoundError(`Metric Category ${metricCategoryId} not found`);
		}
		if (params.code && params.code !== metricCategory.code) {
			const metricCategoryWithSameCode = await this.metricCategoryRepository.findByCode(params.code);
			if (metricCategoryWithSameCode) {
				throw new ValidationError(
					{ code: `Metric Category with code ${params.code} already exists` },
					`Metric Category with code ${params.code} already exists`
				);
			}
		}
		return this.metricCategoryRepository.update(
			metricCategoryId,
			omitBy(
				{
					title: params.title,
					code: params.code,
					status: params.status,
					metadata: params.metadata,
				},
				isUndefined
			) as MetricCategoryUpdateAttributes
		);
	}

	public async delete(metricCategoryId: number): Promise<void> {
		const metricCategory = await this.metricCategoryRepository.read(metricCategoryId);
		if (!metricCategory) {
			throw new NotFoundError(`Metric Category ${metricCategoryId} not found`);
		}

		const associatedMetricTypes = await this.metricTypeRepository.search({ metricCategoryId });
		if (associatedMetricTypes.data.length > 0) {
			throw new ValidationError(
				{ code: `Metric Category ${metricCategoryId} cannot be deleted as it has associated Metric Types` },
				`Metric Category ${metricCategoryId} cannot be deleted as it has associated Metric Types`
			);
		}

		await this.metricCategoryRepository.delete(metricCategoryId);
	}
}

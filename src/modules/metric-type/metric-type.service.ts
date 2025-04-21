import {
	autoInjectable,
	inject,
	NotFoundError,
	signedInternalFetch,
	ValidationError,
	I18nType,
} from "@structured-growth/microservice-sdk";
import MetricType, { MetricTypeUpdateAttributes } from "../../../database/models/metric-type.sequelize";
import { MetricTypeCreateBodyInterface } from "../../interfaces/metric-type-create-body.interface";
import { MetricTypeUpdateBodyInterface } from "../../interfaces/metric-type-update-body.interface";
import { MetricTypeRepository } from "./metric-type.repository";
import { MetricCategoryRepository } from "../metric-category/metric-category.repository";
import { isUndefined, map, omit, omitBy } from "lodash";
import { MetricService } from "../metric/metric.service";
import { MetricTypeSearchParamsInterface } from "../../interfaces/metric-type-search-params.interface";
import { SearchResultInterface } from "@structured-growth/microservice-sdk";
import MetricCategory from "../../../database/models/metric-category.sequelize";

@autoInjectable()
export class MetricTypeService {
	private i18n: I18nType;
	constructor(
		@inject("MetricTypeRepository") private metricTypeRepository: MetricTypeRepository,
		@inject("MetricCategoryRepository") private metricCategoryRepository: MetricCategoryRepository,
		@inject("MetricService") private metricService: MetricService,
		@inject("accountApiUrl") private accountApiUrl: string,
		@inject("i18n") private getI18n: () => I18nType
	) {
		this.i18n = this.getI18n();
	}

	public async search(
		params: MetricTypeSearchParamsInterface & {
			metadata?: Record<string, string>;
		}
	): Promise<SearchResultInterface<MetricType>> {
		if (params.metricCategoryCode) {
			const categories = await this.metricCategoryRepository.search({
				code: [params.metricCategoryCode],
				limit: 1,
			});
			params.metricCategoryId = categories.data[0]?.id || -1;
		}

		if (params.includeInherited) {
			const response = await signedInternalFetch(`${this.accountApiUrl}/v1/organizations/${params.orgId}/parents`);
			const organizations: object[] = (await response.json()) as any;
			const orgIds: number[] = organizations.map((org) => org["id"]);

			return this.metricTypeRepository.search({
				...omit(params, "includeInherited", "orgId"),
				orgId: [params.orgId, ...orgIds],
			});
		} else {
			return this.metricTypeRepository.search({
				...omit(params, "includeInherited", "orgId"),
				orgId: [params.orgId],
			});
		}
	}

	public async create(params: MetricTypeCreateBodyInterface): Promise<MetricType> {
		if (params.metricCategoryId) {
			const checkMetricCategoryId = await this.metricCategoryRepository.read(params.metricCategoryId);
			if (!checkMetricCategoryId) {
				throw new NotFoundError(
					`${this.i18n.__("error.metric_type.category")} ${params.metricCategoryId} ${this.i18n.__(
						"error.common.not_found"
					)}`
				);
			}
		}
		const existingMetricType = await this.metricTypeRepository.findByCode(params.code);
		if (existingMetricType) {
			throw new ValidationError(
				{ code: `Metric Type with code ${params.code} already exists` },
				`${this.i18n.__("error.metric_type.name")} ${params.code} ${this.i18n.__("error.metric_type.exist")}`
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
		const metricType = await this.metricTypeRepository.read(metricTypeId);
		if (!metricType) {
			throw new NotFoundError(
				`${this.i18n.__("error.metric_type.name")} ${metricTypeId} ${this.i18n.__("error.common.not_found")}`
			);
		}
		if (params.code && params.code !== metricType.code) {
			const metricCategoryWithSameCode = await this.metricTypeRepository.findByCode(params.code);
			if (metricCategoryWithSameCode) {
				throw new ValidationError(
					{ code: `Metric Type with code ${params.code} already exists` },
					`${this.i18n.__("error.metric_type.name")} ${params.code} ${this.i18n.__("error.metric_type.exist")}`
				);
			}
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
			throw new NotFoundError(
				`${this.i18n.__("error.metric_type.name")} ${metricTypeId} ${this.i18n.__("error.common.not_found")}`
			);
		}
		const orgId = metricType.orgId;
		const associatedMetric = await this.metricService.search({ orgId, metricTypeId: [metricTypeId] });
		if (associatedMetric.data.length > 0) {
			throw new ValidationError(
				{ code: `Metric Type ${metricTypeId} cannot be deleted as it has associated Metric` },
				`${this.i18n.__("error.metric_type.name")} ${metricTypeId} ${this.i18n.__("error.metric_type.deleted")}`
			);
		}

		await this.metricTypeRepository.delete(metricTypeId);
	}
}

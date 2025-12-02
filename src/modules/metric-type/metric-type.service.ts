import {
	autoInjectable,
	inject,
	NotFoundError,
	signedInternalFetch,
	Cache,
	ValidationError,
	I18nType,
	injectWithTransform,
	LoggerTransform,
	Logger,
} from "@structured-growth/microservice-sdk";
import MetricType, { MetricTypeUpdateAttributes } from "../../../database/models/metric-type.sequelize";
import { MetricTypeCreateBodyInterface } from "../../interfaces/metric-type-create-body.interface";
import { MetricTypeUpdateBodyInterface } from "../../interfaces/metric-type-update-body.interface";
import { MetricTypeRepository } from "./metric-type.repository";
import { MetricCategoryRepository } from "../metric-category/metric-category.repository";
import { isUndefined, omit, omitBy } from "lodash";
import { MetricSqlRepository } from "../metric/repositories/metric-sql.repository";
import { MetricTypeSearchParamsInterface } from "../../interfaces/metric-type-search-params.interface";
import { SearchResultInterface } from "@structured-growth/microservice-sdk";
import { Transaction } from "sequelize";

@autoInjectable()
export class MetricTypeService {
	private i18n: I18nType;

	private readonly cacheTtlSec = 30 * 24 * 60 * 60;

	private cacheKeyById = (id: number) => `metricType:id:${id}`;
	private cacheKeyByCode = (code: string) => `metricType:code:${code}`;

	constructor(
		@inject("MetricTypeRepository") private metricTypeRepository: MetricTypeRepository,
		@inject("MetricCategoryRepository") private metricCategoryRepository: MetricCategoryRepository,
		@inject("MetricSqlRepository") private metricSqlRepository: MetricSqlRepository,
		@inject("accountApiUrl") private accountApiUrl: string,
		@inject("Cache") private cache: Cache,
		@inject("i18n") private getI18n: () => I18nType,
		@injectWithTransform("Logger", LoggerTransform, { module: "MetricType" }) private logger?: Logger
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

		const created = await this.metricTypeRepository.create({
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

		await this.cacheSet(created);
		return created;
	}

	public async update(metricTypeId, params: MetricTypeUpdateBodyInterface): Promise<MetricType> {
		const current = await this.metricTypeRepository.read(metricTypeId);
		if (!current) {
			throw new NotFoundError(
				`${this.i18n.__("error.metric_type.name")} ${metricTypeId} ${this.i18n.__("error.common.not_found")}`
			);
		}
		if (params.code && params.code !== current.code) {
			const metricCategoryWithSameCode = await this.metricTypeRepository.findByCode(params.code);
			if (metricCategoryWithSameCode) {
				throw new ValidationError(
					{ code: `Metric Type with code ${params.code} already exists` },
					`${this.i18n.__("error.metric_type.name")} ${params.code} ${this.i18n.__("error.metric_type.exist")}`
				);
			}
		}
		const updated = await this.metricTypeRepository.update(
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

		if (params.code && params.code !== current.code) {
			await this.cache.del(this.cacheKeyByCode(current.code));
		}

		await this.cacheSet(updated);

		return updated;
	}

	public async delete(metricTypeId: number): Promise<void> {
		const metricType = await this.metricTypeRepository.read(metricTypeId);

		if (!metricType) {
			throw new NotFoundError(
				`${this.i18n.__("error.metric_type.name")} ${metricTypeId} ${this.i18n.__("error.common.not_found")}`
			);
		}
		const orgId = metricType.orgId;
		const associatedMetric = await this.metricSqlRepository.search({ orgId, metricTypeId: [metricTypeId] });
		if (associatedMetric.data.length > 0) {
			throw new ValidationError(
				{ code: `Metric Type ${metricTypeId} cannot be deleted as it has associated Metric` },
				`${this.i18n.__("error.metric_type.name")} ${metricTypeId} ${this.i18n.__("error.metric_type.deleted")}`
			);
		}

		await this.metricTypeRepository.delete(metricTypeId);

		await this.cache.del(this.cacheKeyById(metricTypeId));
		await this.cache.del(this.cacheKeyByCode(metricType.code));
	}

	private async cacheSet(t: MetricType): Promise<void> {
		await this.cache.mset(
			{
				[this.cacheKeyById(t.id)]: t,
				[this.cacheKeyByCode(t.code)]: t,
			},
			this.cacheTtlSec
		);
	}

	public async getByCodes(codes: string[], transaction?: Transaction): Promise<MetricType[]> {
		if (codes.length === 0) return [];
		const keys = codes.map(this.cacheKeyByCode);
		const cached = await this.cache.mget<MetricType>(keys);

		const needFetch: string[] = [];
		const result: MetricType[] = [];
		for (let i = 0; i < codes.length; i++) {
			const hit = cached[i];
			if (hit) result.push(hit);
			else needFetch.push(codes[i]);
		}

		if (needFetch.length > 0) {
			const fetched = await this.metricTypeRepository.search({ code: needFetch }, transaction);
			const toSet: Record<string, any> = {};
			for (const t of fetched.data) {
				result.push(t);
				toSet[this.cacheKeyByCode(t.code)] = t;
				toSet[this.cacheKeyById(t.id)] = t;
			}
			if (Object.keys(toSet).length) {
				await this.cache.mset(toSet, this.cacheTtlSec);
			}
		}

		return result;
	}

	public async getByIds(ids: number[], transaction?: Transaction): Promise<Map<number, MetricType>> {
		const map = new Map<number, MetricType>();
		if (ids.length === 0) return map;

		const keys = ids.map(this.cacheKeyById);
		const cached = await this.cache.mget<MetricType>(keys);

		const needFetch: number[] = [];
		for (let i = 0; i < ids.length; i++) {
			const hit = cached[i];
			if (hit) map.set(ids[i], hit);
			else needFetch.push(ids[i]);
		}

		if (needFetch.length > 0) {
			const fetched = await this.metricTypeRepository.search({ id: needFetch }, transaction);
			const toSet: Record<string, any> = {};
			for (const t of fetched.data) {
				map.set(t.id, t);
				toSet[this.cacheKeyById(t.id)] = t;
				toSet[this.cacheKeyByCode(t.code)] = t;
			}
			if (Object.keys(toSet).length) {
				await this.cache.mset(toSet, this.cacheTtlSec);
			}
		}

		return map;
	}
}

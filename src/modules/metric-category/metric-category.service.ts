import {
	autoInjectable,
	inject,
	NotFoundError,
	I18nType,
	CacheService,
	injectWithTransform,
	LoggerTransform,
	Logger,
} from "@structured-growth/microservice-sdk";
import MetricCategory, { MetricCategoryUpdateAttributes } from "../../../database/models/metric-category.sequelize";
import { MetricCategoryCreateBodyInterface } from "../../interfaces/metric-category-create-body.interface";
import { MetricCategoryUpdateBodyInterface } from "../../interfaces/metric-category-update-body.interface";
import { MetricCategoryRepository } from "./metric-category.repository";
import { MetricTypeRepository } from "../metric-type/metric-type.repository";
import { isUndefined, omit, omitBy } from "lodash";
import { ValidationError } from "@structured-growth/microservice-sdk";
import { SearchResultInterface, signedInternalFetch } from "@structured-growth/microservice-sdk";
import { MetricCategorySearchParamsInterface } from "../../interfaces/metric-category-search-params.interface";
import { Transaction } from "sequelize";

@autoInjectable()
export class MetricCategoryService {
	private i18n: I18nType;

	private readonly cacheTtlSec = 30 * 24 * 60 * 60;

	private cacheKeyById = (id: number) => `metricCategory:id:${id}`;
	private cacheKeyByCode = (code: string) => `metricCategory:code:${code}`;

	private entityTag = (arn: string) => `metricCategory:entity:${arn}`;

	constructor(
		@inject("MetricCategoryRepository") private metricCategoryRepository: MetricCategoryRepository,
		@inject("MetricTypeRepository") private metricTypeRepository: MetricTypeRepository,
		@inject("accountApiUrl") private accountApiUrl: string,
		@inject("i18n") private getI18n: () => I18nType,
		@inject("CacheService") private cacheService: CacheService,
		@injectWithTransform("Logger", LoggerTransform, { module: "Metric" }) private logger?: Logger
	) {
		this.i18n = this.getI18n();
	}

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
				`${this.i18n.__("error.metric_category.name")} ${params.code} ${this.i18n.__("error.metric_category.exist")}`
			);
		}
		const created = await this.metricCategoryRepository.create({
			orgId: params.orgId,
			region: params.region,
			title: params.title,
			code: params.code,
			status: params.status || "inactive",
			metadata: params.metadata,
		});

		await this.cacheSet(created);
		return created;
	}

	public async update(metricCategoryId: any, params: MetricCategoryUpdateBodyInterface): Promise<MetricCategory> {
		const current = await this.metricCategoryRepository.read(metricCategoryId);
		if (!current) {
			throw new NotFoundError(
				`${this.i18n.__("error.metric_category.name")} ${metricCategoryId} ${this.i18n.__("error.common.not_found")}`
			);
		}
		if (params.code && params.code !== current.code) {
			const metricCategoryWithSameCode = await this.metricCategoryRepository.findByCode(params.code);
			if (metricCategoryWithSameCode) {
				throw new ValidationError(
					{ code: `Metric Category with code ${params.code} already exists` },
					`${this.i18n.__("error.metric_category.name")} ${params.code} ${this.i18n.__("error.metric_category.exist")}`
				);
			}
		}

		await this.cacheService.invalidateTag(this.entityTag(current.arn)).catch(() => null);

		const updated = await this.metricCategoryRepository.update(
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

		await this.cacheSet(updated);
		return updated;
	}

	public async delete(metricCategoryId: number): Promise<void> {
		const metricCategory = await this.metricCategoryRepository.read(metricCategoryId);
		if (!metricCategory) {
			throw new NotFoundError(
				`${this.i18n.__("error.metric_category.name")} ${metricCategoryId} ${this.i18n.__("error.common.not_found")}`
			);
		}

		const associatedMetricTypes = await this.metricTypeRepository.search({ metricCategoryId });
		if (associatedMetricTypes.data.length > 0) {
			throw new ValidationError(
				{ code: `Metric Category ${metricCategoryId} cannot be deleted as it has associated Metric Types` },
				`${this.i18n.__("error.metric_category.name")} ${metricCategoryId} ${this.i18n.__(
					"error.metric_category.deleted"
				)}`
			);
		}

		await this.metricCategoryRepository.delete(metricCategoryId);
	}

	private async cacheSet(c: MetricCategory): Promise<void> {
		const v = { id: c.id, code: c.code, arn: c.arn };

		await this.cacheService.msetWithTags(
			{
				[this.cacheKeyById(c.id)]: v,
				[this.cacheKeyByCode(c.code)]: v,
			},
			[this.entityTag(c.arn)],
			this.cacheTtlSec
		);
	}

	public async getByIds(
		ids: number[],
		transaction?: Transaction
	): Promise<Map<number, { id: number; code: string; arn: string }>> {
		const map = new Map<number, { id: number; code: string; arn: string }>();
		if (ids.length === 0) return map;

		const keys = ids.map(this.cacheKeyById);
		const cached = await this.cacheService.mget<{ id: number; code: string; arn: string }>(keys);

		const needFetch: number[] = [];
		for (let i = 0; i < ids.length; i++) {
			const hit = cached[i];
			if (hit) map.set(ids[i], hit);
			else needFetch.push(ids[i]);
		}

		if (needFetch.length > 0) {
			const fetched = await this.metricCategoryRepository.search({ id: needFetch }, transaction);

			for (const c of fetched.data) {
				const v = { id: c.id, code: c.code, arn: c.arn };
				map.set(c.id, v);

				await this.cacheSet(c);
			}
		}

		return map;
	}

	public async getByCodes(
		codes: string[],
		transaction?: Transaction
	): Promise<Map<string, { id: number; code: string; arn: string }>> {
		const map = new Map<string, { id: number; code: string; arn: string }>();
		if (codes.length === 0) return map;

		const keys = codes.map(this.cacheKeyByCode);
		const cached = await this.cacheService.mget<{ id: number; code: string; arn: string }>(keys);

		const needFetch: string[] = [];
		for (let i = 0; i < codes.length; i++) {
			const hit = cached[i];
			if (hit) map.set(codes[i], hit);
			else needFetch.push(codes[i]);
		}

		if (needFetch.length > 0) {
			const fetched = await this.metricCategoryRepository.search({ code: needFetch }, transaction);

			for (const c of fetched.data) {
				const v = { id: c.id, code: c.code, arn: c.arn };
				map.set(c.code, v);

				await this.cacheSet(c);
			}
		}

		return map;
	}
}

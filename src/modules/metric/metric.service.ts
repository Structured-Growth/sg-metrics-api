import {
	autoInjectable,
	EventbusService,
	I18nType,
	inject,
	Cache,
	NotFoundError,
	SearchResultInterface,
	ServerError,
	signedInternalFetch,
	injectWithTransform,
	LoggerTransform,
	Logger,
} from "@structured-growth/microservice-sdk";
import { v4 } from "uuid";
import * as AWS from "aws-sdk";
import { MetricSqlRepository } from "./repositories/metric-sql.repository";
import {
	Metric,
	MetricCreationAttributes,
	MetricExtended,
	MetricUpdateAttributes,
} from "../../../database/models/metric";
import { MetricCreateBodyInterface } from "../../interfaces/metric-create-body.interface";
import { MetricSearchParamsInterface } from "../../interfaces/metric-search-params.interface";
import { MetricExportParamsInterface } from "../../interfaces/metric-export-params.interface";
import { MetricAggregateParamsInterface } from "../../interfaces/metric-aggregate-params.interface";
import {
	MetricAggregateResultInterface,
	MetricAggregationInterface,
} from "../../interfaces/metric-aggregate-result.interface";
import { keyBy, map, omit, uniq } from "lodash";
import { MetricTypeService } from "../metric-type/metric-type.service";
import MetricType from "../../../database/models/metric-type.sequelize";
import { MetricCategoryService } from "../metric-category/metric-category.service";
import MetricSQL from "../../../database/models/metric-sql.sequelize";
import { Op, Transaction } from "sequelize";
import { MetricsBulkResultInterface } from "./interfaces/metrics-bulk-result.interface";
import { MetricStatisticsBodyInterface } from "../../interfaces/metric-statistics-body.interface";
import { MetricStatisticsResponseInterface } from "../../interfaces/metric-statistics-response.interface";
import { MetricsUpsertBodyInterface } from "../../interfaces/metrics-upsert-body.interface";
import { MetricsBulkDataInterface } from "./interfaces/metrics-bulk-data.interface";

@autoInjectable()
export class MetricService {
	private i18n: I18nType;
	private s3: AWS.S3;

	constructor(
		@inject("MetricSqlRepository") private metricSqlRepository: MetricSqlRepository,
		@inject("MetricCategoryService") private metricCategoryService: MetricCategoryService,
		@inject("MetricTypeService") private metricTypeService: MetricTypeService,
		@inject("EventbusService") private eventBus: EventbusService,
		@inject("appPrefix") private appPrefix: string,
		@inject("i18n") private getI18n: () => I18nType,
		@inject("Cache") private cache: Cache,
		@inject("accountApiUrl") private accountApiUrl: string,
		@injectWithTransform("Logger", LoggerTransform, { module: "Metric" }) private logger?: Logger
	) {
		this.i18n = this.getI18n();
		this.s3 = new AWS.S3();
	}

	public async create(params: MetricCreateBodyInterface[], transaction?: Transaction): Promise<MetricExtended[]> {
		// check if there are metrics with metricTypeCode and populate them with metricTypeId and metricCategoryId
		const metricTypeCodes = map(params, "metricTypeCode").filter((i) => !!i);
		let metricTypesMap: Record<string, MetricType> = {};
		if (metricTypeCodes.length) {
			const metricTypes = await this.metricTypeService.getByCodes(metricTypeCodes, transaction);
			metricTypesMap = keyBy(metricTypes, "code");
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

		const { typeCodeMap, categoryCodeMap } = await this.getMetricCodeMaps(result, transaction);

		return result.map(
			(metric) =>
				Object.assign(metric, {
					metricTypeCode: typeCodeMap.get(metric.metricTypeId),
					metricCategoryCode: categoryCodeMap.get(metric.metricCategoryId),
				}) as Metric & { metricTypeCode?: string; metricCategoryCode?: string }
		);
	}

	public async upsert(params: MetricCreateBodyInterface[], transaction?: Transaction): Promise<MetricExtended[]> {
		this.logger.info("START UPSERT");
		// check if there are metrics with metricTypeCode and populate them with metricTypeId and metricCategoryId
		const metricTypeCodes = map(params, "metricTypeCode").filter((i) => !!i);
		this.logger.info("FILTER_METRIC_TYPE_CODES");
		let metricTypesMap: Record<string, MetricType> = {};
		if (metricTypeCodes.length) {
			const metricTypes = await this.metricTypeService.getByCodes(metricTypeCodes, transaction);
			metricTypesMap = keyBy(metricTypes, "code");
		}
		this.logger.info("GET_BY_CODES_CACHED");

		const data: MetricsUpsertBodyInterface[] = params.map((param) => {
			return {
				...param,
				metricCategoryId: param.metricCategoryId || metricTypesMap[param.metricTypeCode]?.metricCategoryId,
				metricTypeId: param.metricTypeId || metricTypesMap[param.metricTypeCode]?.id,
				id: param.id || v4(),
				isDeleted: false,
			};
		});

		this.logger.info("CREATE_DATA_METRICS_UPSERT");

		if (!data.length) {
			return [];
		}

		const createdMetrics: Metric[] = [];

		const result = await Promise.all(
			data.map(async (item) => {
				const { model } = await this.metricSqlRepository.upsert(item, transaction);
				createdMetrics.push(model);
				return model;
			})
		);

		this.logger.info("METRICS_UPSERT_REPOSITORY");

		if (createdMetrics.length > 0) {
			this.publishGroupedMetricEvents(createdMetrics);
		}

		this.logger.info("EVENTBUS_DONE");

		const resultMetrics = result.map((item) => new Metric(item.toJSON()));

		const { typeCodeMap, categoryCodeMap } = await this.getMetricCodeMaps(resultMetrics, transaction);

		this.logger.info("GET_METRIC_CODE_MAPS_DONE");

		return resultMetrics.map(
			(metric) =>
				Object.assign(metric, {
					metricTypeCode: typeCodeMap.get(metric.metricTypeId),
					metricCategoryCode: categoryCodeMap.get(metric.metricCategoryId),
				}) as Metric & { metricTypeCode: string; metricCategoryCode: string }
		);
	}

	public async search(params: MetricSearchParamsInterface & {}): Promise<
		SearchResultInterface<MetricExtended> & {
			nextToken?: string;
		}
	> {
		// get metric category id by its code, if provided
		if (params.metricCategoryCode) {
			const catMap = await this.metricCategoryService.getByCodes([params.metricCategoryCode]);
			const found = catMap.get(params.metricCategoryCode);
			if (found) {
				params.metricCategoryId = found.id;
			}
		}

		// get metric type ids by theirs codes, if provided
		if (params.metricTypeCode?.length > 0) {
			const types = await this.metricTypeService.getByCodes(uniq(params.metricTypeCode));
			const typeIds = types.map((t) => t.id);
			params.metricTypeId = uniq([...(params.metricTypeId || []), ...typeIds]);
		}

		let metrics = await this.metricSqlRepository.search(params);

		const { typeCodeMap, categoryCodeMap } = await this.getMetricCodeMaps(metrics.data);

		const enrichedData = metrics.data.map(
			(metric) =>
				Object.assign(metric, {
					metricTypeCode: typeCodeMap.get(metric.metricTypeId),
					metricCategoryCode: categoryCodeMap.get(metric.metricCategoryId),
				}) as Metric & {
					metricTypeCode: string;
					metricCategoryCode: string;
				}
		);

		return {
			...metrics,
			data: enrichedData,
		};
	}

	public async export(
		params: MetricExportParamsInterface & {},
		orgId: number,
		accountId: number
	): Promise<{ params: MetricExportParamsInterface; email: string }> {
		let emailsData;
		try {
			const emailUrl = `${this.accountApiUrl}/v1/emails?orgId=${orgId}&accountId[]=${accountId}&isPrimary=true`;
			const emailResponse = await signedInternalFetch(emailUrl, {
				method: "get",
				headers: {
					"Content-Type": "application/json",
					"Accept-Language": this.i18n.locale,
				},
			});
			emailsData = await emailResponse.json();
		} catch (err) {
			console.log("Error: ", err);
			throw new ServerError(this.i18n.__("error.export.server_problem"));
		}

		if (!emailsData || emailsData.data.length !== 1) {
			throw new NotFoundError(this.i18n.__("error.export.no_emails"));
		}

		// get metric category id by its code, if provided
		if (params.metricCategoryCode) {
			const catMap = await this.metricCategoryService.getByCodes([params.metricCategoryCode]);
			const found = catMap.get(params.metricCategoryCode);
			if (found) {
				params.metricCategoryId = found.id;
			}
		}

		// get metric type ids by theirs codes, if provided
		if (params.metricTypeCode?.length > 0) {
			const codes = uniq(params.metricTypeCode);
			const types = await this.metricTypeService.getByCodes(codes);
			const typeIds = types.map((t) => t.id);
			params.metricTypeId = uniq([...(params.metricTypeId || []), ...typeIds]);
		}

		return { params, email: emailsData.data[0].email };
	}

	public async aggregate(
		params: MetricAggregateParamsInterface & { page?: number; limit?: number; sort?: any }
	): Promise<
		MetricAggregateResultInterface & {
			data: MetricAggregationInterface[];
		}
	> {
		if (params.column === "time") {
			params.column = "takenAt";
		}
		if (params.row === "time") {
			params.row = "takenAt";
		}

		// get metric category id by its code, if provided
		if (params.metricCategoryCode) {
			const catMap = await this.metricCategoryService.getByCodes([params.metricCategoryCode]);
			const found = catMap.get(params.metricCategoryCode);
			if (found) params.metricCategoryId = found.id;
		}

		// get metric type ids by theirs codes, if provided
		if (params.metricTypeCode?.length > 0) {
			const types = await this.metricTypeService.getByCodes(uniq(params.metricTypeCode));
			const typeIds = types.map((t) => t.id);
			params.metricTypeId = uniq([...(params.metricTypeId || []), ...typeIds]);
		}

		const result = await this.metricSqlRepository.aggregate(params);

		const ids = uniq(result.data.map((i) => i.metricTypeId));
		const typeMap = await this.metricTypeService.getByIds(ids);

		const enrichedData = result.data.map((item) => ({
			...item,
			metricTypeCode: typeMap.get(item.metricTypeId)?.code,
		}));

		return {
			...result,
			data: enrichedData,
		};
	}

	public async read(id: string, transaction?: Transaction): Promise<MetricExtended | null> {
		const metric = await this.metricSqlRepository.read(id, { transaction });
		if (!metric) {
			throw new NotFoundError(`${this.i18n.__("error.metric.name")} ${id} ${this.i18n.__("error.common.not_found")}`);
		}

		const metricJson = metric.toJSON();
		const typeId = metricJson.metricTypeId;
		const catId = metricJson.metricCategoryId;

		const [typeMap, catMap] = await Promise.all([
			this.metricTypeService.getByIds([typeId], transaction),
			this.metricCategoryService.getByIds([catId], transaction),
		]);

		const metricType = typeMap.get(typeId);
		const metricCategory = catMap.get(catId);

		return Object.assign(new Metric(metricJson), {
			metricTypeCode: metricType?.code,
			metricCategoryCode: metricCategory?.code,
		}) as Metric & {
			metricTypeCode?: string;
			metricCategoryCode?: string;
		};
	}

	public async update(
		id: string,
		params: MetricUpdateAttributes & { metricTypeCode?: string; metricTypeVersion?: number },
		transaction?: Transaction
	): Promise<MetricExtended> {
		let { metricTypeCode, metricTypeVersion, ...updateParams } = params;

		let metricTypeId: number | undefined;
		let metricType: MetricType | undefined;

		if (metricTypeCode && metricTypeVersion) {
			const types = await this.metricTypeService.getByCodes([metricTypeCode], transaction);
			metricType = types[0];
			metricTypeId = metricType?.id;

			if (!metricTypeId) {
				throw new NotFoundError(
					`${this.i18n.__("error.metric.metric_type")} ${metricTypeCode} ${this.i18n.__("error.common.not_found")}`
				);
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

		const metric = new Metric(updatedMetric.toJSON());

		let metricCategoryCode: string | undefined;

		if (metricType) {
			const catMap = await this.metricCategoryService.getByIds([metricType.metricCategoryId], transaction);
			metricCategoryCode = catMap.get(metricType.metricCategoryId)?.code;
		} else {
			const [typeMap, catMap] = await Promise.all([
				this.metricTypeService.getByIds([metric.metricTypeId], transaction),
				this.metricCategoryService.getByIds([metric.metricCategoryId], transaction),
			]);
			metricTypeCode = typeMap.get(metric.metricTypeId)?.code;
			metricCategoryCode = catMap.get(metric.metricCategoryId)?.code;
		}

		return Object.assign(metric, {
			metricTypeCode,
			metricCategoryCode,
		}) as MetricExtended;
	}

	public async delete(id: string, transaction?: Transaction): Promise<void> {
		await this.metricSqlRepository.delete(id, transaction);
	}

	public async bulk(data: MetricsBulkDataInterface): Promise<MetricsBulkResultInterface> {
		const result: MetricsBulkResultInterface = [];
		await MetricSQL.sequelize.transaction(async (transaction) => {
			for (let operation of data) {
				switch (operation.op) {
					case "create":
						const createResult = await this.create([operation.data] as any, transaction);
						result.push({
							op: "create",
							data: createResult[0],
						});
						break;
					case "upsert":
						const upsertResult = await this.upsert([operation.data] as any, transaction);
						result.push({
							op: "upsert",
							data: upsertResult[0],
						});
						break;
					case "update":
						const updateResult = await this.update(operation.data.id, omit(operation.data, "id") as any, transaction);
						result.push({
							op: "update",
							data: updateResult,
						});
						break;
					case "delete":
						await this.delete(operation.data.id, transaction);
						result.push({
							op: "delete",
							data: { id: operation.data.id },
						});
						break;
				}
			}
		});
		return result;
	}

	public async getMetricCodeMaps(
		metrics: { metricTypeId: number; metricCategoryId: number }[],
		transaction?: Transaction
	): Promise<{
		typeCodeMap: Map<number, string>;
		categoryCodeMap: Map<number, string>;
	}> {
		this.logger.info("GET_METRIC_CODE_MAPS_START");
		const typeIds = uniq(metrics.map((m) => m.metricTypeId));
		const catIds = uniq(metrics.map((m) => m.metricCategoryId));

		const typeMapById = await this.metricTypeService.getByIds(typeIds, transaction);
		this.logger.info("GET_METRIC_CODE_TYPE_MAP_BY_ID");
		const catMap = await this.metricCategoryService.getByIds(catIds, transaction);
		this.logger.info("GET_METRIC_CODE_CAT_MAP");

		const typeCodeMap = new Map<number, string>();
		for (const id of typeIds) {
			const t = typeMapById.get(id);
			if (t) typeCodeMap.set(id, t.code);
		}

		const categoryCodeMap = new Map<number, string>();
		for (const id of catIds) {
			const c = catMap.get(id);
			if (c) categoryCodeMap.set(id, c.code);
		}

		return { typeCodeMap, categoryCodeMap };
	}

	public async generateStatisticsRange(
		params: MetricStatisticsBodyInterface
	): Promise<MetricStatisticsResponseInterface> {
		const { userId, accountId, startPreviousPeriod, startCurrentPeriod, lowThreshold, highThreshold } = params;

		const baseWhere = {
			userId,
			accountId,
		};

		const wherePrev = {
			...baseWhere,
			takenAt: {
				[Op.gte]: startPreviousPeriod,
				[Op.lt]: startCurrentPeriod,
			},
		};

		const countPreviousPeriod = await MetricSQL.count({ where: wherePrev });

		const lowValuePrevious = await MetricSQL.count({
			where: {
				...wherePrev,
				value: { [Op.lt]: lowThreshold },
			},
		});

		const highValuePrevious = await MetricSQL.count({
			where: {
				...wherePrev,
				value: { [Op.gt]: highThreshold },
			},
		});

		const rawStartTimePrevious = (await MetricSQL.min("takenAt", { where: wherePrev })) as string | Date | null;
		const startTimePrevious = rawStartTimePrevious ? new Date(rawStartTimePrevious) : null;

		const whereCurr = {
			...baseWhere,
			takenAt: {
				[Op.gte]: startCurrentPeriod,
			},
		};

		const countCurrentPeriod = await MetricSQL.count({ where: whereCurr });

		const lowValueCurrent = await MetricSQL.count({
			where: {
				...whereCurr,
				value: { [Op.lt]: lowThreshold },
			},
		});

		const highValueCurrent = await MetricSQL.count({
			where: {
				...whereCurr,
				value: { [Op.gt]: highThreshold },
			},
		});

		const rawStartTimeCurrent = (await MetricSQL.min("takenAt", { where: whereCurr })) as string | Date | null;
		const startTimeCurrent = rawStartTimeCurrent ? new Date(rawStartTimeCurrent) : null;

		function toPercent(part: number, total: number): number {
			if (total === 0) return 0;
			return Number(((part / total) * 100).toFixed(0));
		}

		return {
			lowValuePrevious: countPreviousPeriod > 0 ? toPercent(lowValuePrevious, countPreviousPeriod) : null,
			highValuePrevious: countPreviousPeriod > 0 ? toPercent(highValuePrevious, countPreviousPeriod) : null,
			inRangeValuePrevious:
				countPreviousPeriod > 0
					? 100 - toPercent(lowValuePrevious, countPreviousPeriod) - toPercent(highValuePrevious, countPreviousPeriod)
					: null,
			countPreviousPeriod,
			startTimePrevious,
			lowValueCurrent: countCurrentPeriod > 0 ? toPercent(lowValueCurrent, countCurrentPeriod) : null,
			highValueCurrent: countCurrentPeriod > 0 ? toPercent(highValueCurrent, countCurrentPeriod) : null,
			inRangeValueCurrent:
				countCurrentPeriod > 0
					? 100 - toPercent(lowValueCurrent, countCurrentPeriod) - toPercent(highValueCurrent, countCurrentPeriod)
					: null,
			countCurrentPeriod,
			startTimeCurrent,
		};
	}

	private publishGroupedMetricEvents(metrics: Metric[]): void {
		type Group = { arn: string; items: Metric[] };
		const groups = new Map<string, Group>();

		const pickVal = (m: any, key: string) => (typeof m.get === "function" ? m.get(key) : m[key]);

		for (const m of metrics) {
			const region = pickVal(m, "region");
			const orgId = pickVal(m, "orgId");
			const accountId = pickVal(m, "accountId");
			const id = pickVal(m, "id");

			if (!region || !orgId || !accountId || !id) continue;

			const key = `${region}:${orgId}:${accountId}`;
			let entry = groups.get(key);
			if (!entry) {
				entry = {
					arn: `${this.appPrefix}:${region}:${orgId}:${accountId}:events/metrics/upsert`,
					items: [],
				};
				groups.set(key, entry);
			}
			entry.items.push(m);
		}

		for (const { arn, items } of groups.values()) {
			void this.eventBus
				.publish({
					arn,
					data: {
						metrics: items.map((metric) => metric.toJSON()),
					},
				})
				.catch((err: unknown) => {
					console.log(
						"Failed to publish metrics upsert event:",
						JSON.stringify({ arn, size: items.length, err: String(err) })
					);
				});
		}
	}
}

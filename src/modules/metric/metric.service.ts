import {
	autoInjectable,
	EventbusService,
	inject,
	NotFoundError,
	ServerError,
	signedInternalFetch,
	SearchResultInterface,
	I18nType,
} from "@structured-growth/microservice-sdk";
import { v4 } from "uuid";
import * as AWS from "aws-sdk";
import { Mailer } from "@structured-growth/microservice-sdk";
import { MetricTimestreamRepository } from "./repositories/metric-timestream.repository";
import { MetricSqlRepository } from "./repositories/metric-sql.repository";
import {
	Metric,
	MetricCreationAttributes,
	MetricUpdateAttributes,
	MetricExtended,
} from "../../../database/models/metric";
import { MetricCreateBodyInterface } from "../../interfaces/metric-create-body.interface";
import { MetricSearchParamsInterface } from "../../interfaces/metric-search-params.interface";
import { MetricExportParamsInterface } from "../../interfaces/metric-export-params.interface";
import { MetricAggregateParamsInterface } from "../../interfaces/metric-aggregate-params.interface";
import {
	MetricAggregateResultInterface,
	MetricAggregationInterface,
} from "../../interfaces/metric-aggregate-result.interface";
import { keyBy, map, omit, pick, uniq } from "lodash";
import { MetricTypeRepository } from "../metric-type/metric-type.repository";
import MetricType from "../../../database/models/metric-type.sequelize";
import { MetricCategoryRepository } from "../metric-category/metric-category.repository";
import { MetricsBulkRequestInterface } from "../../interfaces/metrics-bulk.request.interface";
import MetricSQL from "../../../database/models/metric-sql.sequelize";
import { Transaction, Op } from "sequelize";
import { MetricsBulkResultInterface } from "./interfaces/metrics-bulk-result.interface";
import { MetricStatisticsBodyInterface } from "../../interfaces/metric-statistics-body.interface";
import { MetricStatisticsResponseInterface } from "../../interfaces/metric-statistics-response.interface";

@autoInjectable()
export class MetricService {
	private i18n: I18nType;
	private s3: AWS.S3;
	constructor(
		@inject("MetricTimestreamRepository") private metricTimestreamRepository: MetricTimestreamRepository,
		@inject("MetricSqlRepository") private metricSqlRepository: MetricSqlRepository,
		@inject("MetricCategoryRepository") private metricCategoryRepository: MetricCategoryRepository,
		@inject("MetricTypeRepository") private metricTypeRepository: MetricTypeRepository,
		@inject("EventbusService") private eventBus: EventbusService,
		@inject("appPrefix") private appPrefix: string,
		@inject("i18n") private getI18n: () => I18nType,
		@inject("accountApiUrl") private accountApiUrl: string,
		@inject("Mailer") private mailer: Mailer
	) {
		this.i18n = this.getI18n();
		this.s3 = new AWS.S3();
	}

	public async create(params: MetricCreateBodyInterface[], transaction?: Transaction): Promise<MetricExtended[]> {
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

		const createdMetrics: Metric[] = [];

		const result = await Promise.all(
			data.map(async (item) => {
				const exists = item.id ? await this.metricSqlRepository.read(item.id, { transaction }) : null;
				if (exists) {
					return this.metricSqlRepository.update(
						item.id,
						pick(
							item,
							"value",
							"takenAt",
							"takenAtOffset",
							"metricCategoryId",
							"metricTypeId",
							"metricTypeVersion",
							"metadata"
						),
						transaction
					);
				} else {
					const creationResult = await this.metricSqlRepository.create(data, transaction);
					createdMetrics.push(creationResult[0]);
					return creationResult[0];
				}
			})
		);

		if (createdMetrics.length > 0) {
			await this.eventBus.publish({
				arn: `${this.appPrefix}:${data[0].region}:${data[0].orgId}:${data[0].accountId}:events/metrics/created`,
				data: {
					metrics: createdMetrics.map((metric) => metric.toJSON()),
				},
			});
		}

		const resultMetrics = result.map((item) => new Metric(item.toJSON()));

		const { typeCodeMap, categoryCodeMap } = await this.getMetricCodeMaps(resultMetrics, transaction);

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

		const result = await this.metricSqlRepository.aggregate(params);

		const metricTypeCodes = await this.metricTypeRepository.search({
			id: uniq(result.data.map((item) => item.metricTypeId)),
		});

		const typeCodeMap = new Map(metricTypeCodes.data.map((mt) => [mt.id, mt.code]));

		const enrichedData = result.data.map((item) => ({
			...item,
			metricTypeCode: typeCodeMap.get(item.metricTypeId),
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

		const [metricType, metricCategory] = await Promise.all([
			this.metricTypeRepository.read(metricJson.metricTypeId),
			this.metricCategoryRepository.read(metricJson.metricCategoryId),
		]);

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
			const metricTypeResult = await this.metricTypeRepository.search({ code: [metricTypeCode] }, transaction);

			metricType = metricTypeResult.data?.[0];
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
			const category = await this.metricCategoryRepository.read(metricType.metricCategoryId);
			metricCategoryCode = category?.code;
		} else {
			const [type, category] = await Promise.all([
				this.metricTypeRepository.read(metric.metricTypeId),
				this.metricCategoryRepository.read(metric.metricCategoryId),
			]);
			metricTypeCode = type?.code;
			metricCategoryCode = category?.code;
		}

		return Object.assign(metric, {
			metricTypeCode,
			metricCategoryCode,
		}) as MetricExtended;
	}

	public async delete(id: string, transaction?: Transaction): Promise<void> {
		await this.metricSqlRepository.delete(id, transaction);
	}

	public async bulk(data: MetricsBulkRequestInterface): Promise<MetricsBulkResultInterface> {
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

	private async getMetricCodeMaps(
		metrics: { metricTypeId: number; metricCategoryId: number }[],
		transaction?: Transaction
	): Promise<{
		typeCodeMap: Map<number, string>;
		categoryCodeMap: Map<number, string>;
	}> {
		const [types, categories] = await Promise.all([
			this.metricTypeRepository.search({ id: uniq(metrics.map((m) => m.metricTypeId)) }, transaction),
			this.metricCategoryRepository.search({ id: uniq(metrics.map((m) => m.metricCategoryId)) }, transaction),
		]);

		const typeCodeMap = new Map(types.data.map((type) => [type.id, type.code]));
		const categoryCodeMap = new Map(categories.data.map((cat) => [cat.id, cat.code]));

		return { typeCodeMap, categoryCodeMap };
	}

	public async exportGeneration(data: { params: MetricExportParamsInterface & {}; columns: string[]; email: string }) {
		console.log("Start EXPORT GENERATION");
		const { params, columns, email } = data;
		console.log("PARAMS: ", params);
		console.log("COLUMNS: ", columns);
		console.log("EMAIL: ", email);
		const { page: _ignoredPage, limit: _ignoredLimit, ...query } = params;

		console.log("QUERY: ", query);
		const PAGE_SIZE = 500;
		let currentPage = 1;

		const getByPath = (obj: any, path: string) => {
			if (!obj || !path) return undefined;
			return path.split(".").reduce((acc, key) => (acc == null ? acc : acc[key]), obj);
		};

		const serialize = (val: any): string => {
			if (val === null || val === undefined) return "";
			if (val instanceof Date) return val.toISOString();
			if (typeof val === "object") return JSON.stringify(val);
			return String(val);
		};

		const escapeCsv = (cell: string): string => {
			const needsQuotes = /[",\r\n]/.test(cell);
			const escaped = cell.replace(/"/g, '""');
			return needsQuotes ? `"${escaped}"` : escaped;
		};

		const header = columns
			.map((colKey) => {
				try {
					return escapeCsv(this.i18n.__(colKey));
				} catch {
					return escapeCsv(colKey);
				}
			})
			.join(",");

		const rows: string[] = [];
		let total = 0;
		let collected = 0;

		while (true) {
			try {
				const batch = await this.metricSqlRepository.search({
					...query,
					page: currentPage,
					limit: PAGE_SIZE,
				});

				if (!batch.data.length) {
					total = batch.total ?? collected;
					break;
				}

				const { typeCodeMap, categoryCodeMap } = await this.getMetricCodeMaps(batch.data);

				const enriched = batch.data.map((metric) =>
					Object.assign(metric, {
						metricTypeCode: typeCodeMap.get(metric.metricTypeId),
						metricCategoryCode: categoryCodeMap.get(metric.metricCategoryId),
					})
				);

				for (const m of enriched) {
					const cells = columns.map((path) => {
						const value = getByPath(m, path);
						return escapeCsv(serialize(value));
					});
					rows.push(cells.join(","));
				}

				collected += batch.data.length;
				total = batch.total ?? collected;

				if (collected >= total) break;
				console.log("CURRENT_PAGE: ", currentPage);
				currentPage += 1;
			} catch (err) {
				console.log("Error receiving/processing batch of metrics", {
					page: currentPage,
					limit: PAGE_SIZE,
					query,
					error: err instanceof Error ? { name: err.name, message: err.message, stack: err.stack } : err,
				});
				throw new ServerError(this.i18n.__("error.export.metrics_batch"));
			}
		}

		const csv = [header, ...rows].join("\r\n");
		const buffer = Buffer.from(csv, "utf8");
		const filename = `metrics_export_${new Date().toISOString().replace(/[:.]/g, "-")}.csv`;

		console.log("FILENAME: ", filename);

		const fullPath = `exports/metrics/${filename}`;

		try {
			await this.s3
				.upload({
					Bucket: process.env.AWS_BUCKET!,
					Key: fullPath,
					Body: buffer,
					ContentType: "text/csv; charset=utf-8",
				})
				.promise();
		} catch (err) {
			console.log("Error uploading report to S3");
			throw new ServerError(this.i18n.__("error.export.upload_failed"));
		}

		console.log("DOWNLOAD FIN");

		let signedUrl: string;
		try {
			signedUrl = await this.s3.getSignedUrlPromise("getObject", {
				Bucket: process.env.AWS_BUCKET!,
				Key: fullPath,
				Expires: Number(process.env.AWS_LINK_EXPIRES),
			});
		} catch (err) {
			console.log("Error creating presigned URL");
			throw new ServerError(this.i18n.__("error.export.link_failed"));
		}

		console.log("URL FIN");

		const mailOk = await this.mailer.send({
			toEmail: email,
			fromEmail: process.env.FROM_EMAIL || "noreply@example.com",
			subject: this.i18n.__("export.letter.report"),
			html: `
				<h1>${this.i18n.__("export.letter.report")}</h1>
				<p>${this.i18n.__("export.letter.get_it")} <a href="${signedUrl}">${this.i18n.__("export.letter.link")}</a>.</p>
				<p>${this.i18n.__("export.letter.link_lifetime")}: ${process.env.AWS_LINK_EXPIRES} ${this.i18n.__(
				"export.letter.seconds"
			)}</p>
			`,
			text: `${this.i18n.__("export.letter.report")}. ${this.i18n.__("export.letter.get_it")} ${this.i18n.__(
				"export.letter.link"
			)}: ${signedUrl}
			${this.i18n.__("export.letter.link_lifetime")}: ${process.env.AWS_LINK_EXPIRES} ${this.i18n.__(
				"export.letter.seconds"
			)}`,
		});

		if (!mailOk) {
			console.error("Failed to send email to user");
			throw new ServerError(this.i18n.__("error.export.email_failed"));
		}
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
}

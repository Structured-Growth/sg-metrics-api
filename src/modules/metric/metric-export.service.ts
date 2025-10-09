import {
	autoInjectable,
	inject,
	NotFoundError,
	ServerError,
	signedInternalFetch,
	I18nType,
	Logger,
	injectWithTransform,
	LoggerTransform,
} from "@structured-growth/microservice-sdk";
import * as AWS from "aws-sdk";
import { Mailer } from "@structured-growth/microservice-sdk";
import { MetricSqlRepository } from "./repositories/metric-sql.repository";
import { MetricExportParamsInterface } from "../../interfaces/metric-export-params.interface";
import { map, uniq, isUndefined, omitBy } from "lodash";
import { MetricTypeRepository } from "../metric-type/metric-type.repository";
import { MetricCategoryRepository } from "../metric-category/metric-category.repository";
import MetricSQL from "../../../database/models/metric-sql.sequelize";
import { Op } from "sequelize";
import * as zlib from "node:zlib";
import { PassThrough } from "stream";
import { MetricService } from "./metric.service";

@autoInjectable()
export class MetricExportService {
	private i18n: I18nType;
	private s3: AWS.S3;
	constructor(
		@inject("MetricSqlRepository") private metricSqlRepository: MetricSqlRepository,
		@inject("MetricCategoryRepository") private metricCategoryRepository: MetricCategoryRepository,
		@inject("MetricTypeRepository") private metricTypeRepository: MetricTypeRepository,
		@inject("MetricService") private metricService: MetricService,
		@inject("i18n") private getI18n: () => I18nType,
		@inject("accountApiUrl") private accountApiUrl: string,
		@inject("Mailer") private mailer: Mailer,
		@injectWithTransform("Logger", LoggerTransform, { module: "MetricExport" }) private logger?: Logger
	) {
		this.i18n = this.getI18n();
		this.s3 = new AWS.S3();
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

	public async exportGeneration(data: { params: MetricExportParamsInterface; columns: string[]; email: string }) {
		const { params, columns, email } = data;
		const { page: _ignoredPage, limit: _ignoredLimit, ...query } = params;

		const PAGE_SIZE = 500;
		let currentPage = 1;

		const header = columns
			.map((colKey) => {
				try {
					return this.escapeCsv(this.i18n.__(`export.columns.${colKey}`));
				} catch {
					return this.escapeCsv(colKey);
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

				const { typeCodeMap, categoryCodeMap } = await this.metricService.getMetricCodeMaps(batch.data);

				const enriched = batch.data.map((metric) =>
					Object.assign(metric, {
						metricTypeCode: typeCodeMap.get(metric.metricTypeId),
						metricCategoryCode: categoryCodeMap.get(metric.metricCategoryId),
					})
				);

				for (const m of enriched) {
					const cells = columns.map((path) => {
						const value = this.getByPath(m, path);
						return this.escapeCsv(this.serialize(value));
					});
					rows.push(cells.join(","));
				}

				collected += batch.data.length;
				total = batch.total ?? collected;

				if (collected >= total) break;
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
			console.log("Failed to send email to user");
			throw new ServerError(this.i18n.__("error.export.email_failed"));
		}
	}

	public async exportGenerationStreamed(data: {
		params: MetricExportParamsInterface;
		columns: string[];
		email: string;
	}) {
		const { params, columns, email } = data;

		this.logger.info("[EXPORT] Start exportGenerationStreamed");

		const header = columns
			.map((colKey) => {
				try {
					return this.escapeCsv(this.i18n.__(`export.columns.${colKey}`));
				} catch {
					return this.escapeCsv(colKey);
				}
			})
			.join(",");

		const gzip = zlib.createGzip();
		const pass = new PassThrough();

		const filename = `metrics_export_${new Date().toISOString().replace(/[:.]/g, "-")}.csv.gz`;
		const s3Key = `exports/metrics/${filename}`;

		this.logger.info(`[EXPORT] File: ${s3Key}`);

		const uploadPromise = this.s3
			.upload(
				{
					Bucket: process.env.AWS_BUCKET!,
					Key: s3Key,
					Body: pass,
					ContentType: "text/csv",
					ContentEncoding: "gzip",
				},
				{
					partSize: 16 * 1024 * 1024,
					queueSize: 4,
				}
			)
			.promise();

		gzip.pipe(pass);

		try {
			await this.writeLine(gzip, header + "\r\n");

			const { where: baseWhere, order } = this.buildQueryCursor(params);

			const PAGE_SIZE = 10_000;
			let lastTakenAt: Date | null = null;
			let totalRows = 0;
			let batch = 0;

			this.logger.info("[EXPORT] Begin streaming loop...");

			while (true) {
				let where = baseWhere;
				if (lastTakenAt != null) {
					where = {
						[Op.and]: [baseWhere, { takenAt: { [Op.lt]: lastTakenAt } }],
					};
				}

				this.logger.info(`[EXPORT] Fetching batch #${++batch} ...`);

				const t0 = Date.now();
				const rows = await MetricSQL.findAll({
					where,
					order,
					limit: PAGE_SIZE,
					raw: true,
				});
				const t1 = Date.now();

				this.logger.info(`[EXPORT] Batch #${batch} fetched: ${rows.length} rows in ${t1 - t0}ms`);

				if (!rows.length) break;

				let enriched = rows;
				try {
					this.logger.info("[EXPORT] Enriching metric codes...");
					const { typeCodeMap, categoryCodeMap } = await this.metricService.getMetricCodeMaps(rows as any);
					enriched = rows.map((m: any) => ({
						...m,
						metricTypeCode: typeCodeMap.get(m.metricTypeId),
						metricCategoryCode: categoryCodeMap.get(m.metricCategoryId),
					}));
				} catch (err) {
					console.log("Export enrich codes fatal", err);
					throw new ServerError(this.i18n.__("error.export.codes_failed"));
				}

				this.logger.info(`[EXPORT] Writing batch #${batch} to gzip...`);
				for (const m of enriched) {
					const line = columns.map((path) => this.escapeCsv(this.serialize(this.getByPath(m, path)))).join(",");
					await this.writeLine(gzip, line + "\r\n");
				}

				totalRows += enriched.length;
				this.logger.info(`[EXPORT] Batch #${batch} written (${enriched.length} rows). Total: ${totalRows}`);

				const last = rows[rows.length - 1] as any;
				lastTakenAt = last.takenAt instanceof Date ? last.takenAt : new Date(last.takenAt);
			}

			this.logger.info("[EXPORT] Finalizing gzip...");
			await new Promise((resolve, reject) => {
				gzip.once("error", reject);
				gzip.end(resolve);
			});

			this.logger.info("[EXPORT] Waiting for S3 upload to complete...");
			await uploadPromise;
			this.logger.info("[EXPORT] S3 upload complete.");
		} catch (err) {
			console.log("Error exporting streamed CSV", err);
			throw new ServerError(this.i18n.__("error.export.upload_failed_stream"));
		}

		let signedUrl: string;
		try {
			signedUrl = await this.s3.getSignedUrlPromise("getObject", {
				Bucket: process.env.AWS_BUCKET!,
				Key: s3Key,
				Expires: Number(process.env.AWS_LINK_EXPIRES),
			});
			this.logger.info("[EXPORT] Presigned URL ready:", signedUrl);
		} catch (err) {
			console.log("Error creating presigned URL");
			throw new ServerError(this.i18n.__("error.export.link_failed"));
		}

		this.logger.info("[EXPORT] Sending email notification to:", email);
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
			console.log("Failed to send email to user");
			throw new ServerError(this.i18n.__("error.export.email_failed"));
		}

		this.logger.info("[EXPORT] ✅ Export completed successfully:", {
			key: s3Key,
			email,
		});
	}

	private escapeCsv(cell: string): string {
		const needsQuotes = /[",\r\n]/.test(cell);
		const escaped = cell.replace(/"/g, '""');
		return needsQuotes ? `"${escaped}"` : escaped;
	}

	private serialize(val: any): string {
		if (val === null || val === undefined) return "";
		if (val instanceof Date) return val.toISOString();
		if (typeof val === "object") return JSON.stringify(val);
		return String(val);
	}

	private getByPath(obj: any, path: string) {
		if (!obj || !path) return undefined;
		return path.split(".").reduce((acc, key) => (acc == null ? acc : acc[key]), obj);
	}

	private async writeLine(stream: NodeJS.WritableStream, line: string) {
		if (!stream.write(line)) {
			await new Promise((resolve) => stream.once("drain", resolve));
		}
	}

	private buildQueryCursor(params: MetricExportParamsInterface) {
		const where: any = { isDeleted: false };

		if (params.id?.length > 0) {
			where["id"] = {
				[Op.or]: params.id.map((str) => ({ [Op.iLike]: str.replace(/\*/g, "%") })),
			};
		}

		params.orgId && (where["orgId"] = params.orgId);
		params.accountId && (where["accountId"] = { [Op.in]: params.accountId });
		params.metricCategoryId && (where["metricCategoryId"] = params.metricCategoryId);
		params.metricTypeId && (where["metricTypeId"] = { [Op.in]: params.metricTypeId });
		params.metricTypeVersion && (where["metricTypeVersion"] = params.metricTypeVersion);
		params.userId && (where["userId"] = { [Op.in]: params.userId });
		params.relatedToRn && (where["relatedToRn"] = params.relatedToRn);
		params.deviceId && (where["deviceId"] = params.deviceId);
		params.batchId && (where["batchId"] = params.batchId);

		(params.value || params.valueMin || params.valueMax) &&
			(where["value"] = omitBy(
				{
					[Op.eq]: params.value,
					[Op.gte]: params.valueMin,
					[Op.lte]: params.valueMax,
				},
				isUndefined
			));

		(params.takenAtMin || params.takenAtMax) &&
			(where["takenAt"] = omitBy(
				{
					[Op.gte]: params.takenAtMin,
					[Op.lte]: params.takenAtMax,
				},
				isUndefined
			));

		(params.recordedAtMin || params.recordedAtMax) &&
			(where["recordedAt"] = omitBy(
				{
					[Op.gte]: params.recordedAtMin,
					[Op.lte]: params.recordedAtMax,
				},
				isUndefined
			));

		const order: any = [["takenAt", "DESC"]];

		return { where, order };
	}
}

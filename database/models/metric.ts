import { container, NotFoundError, RegionEnum } from "@structured-growth/microservice-sdk";
import { MetricTimestreamRepository } from "../../src/modules/metric/repositories/metric-timestream.repository";
import { MetricService } from "../../src/modules/metric/metric.service";

export interface MetricAttributes {
	id: string;
	orgId: number;
	region: RegionEnum;
	accountId?: number;
	userId?: number;
	relatedToRn?: string;
	metricCategoryId: number;
	metricTypeId: number;
	metricTypeVersion: number;
	deviceId?: number;
	batchId: string;
	value: number;
	takenAt: Date;
	takenAtOffset: number;
	recordedAt: Date;
	isDeleted: boolean;
	metadata: object;
	arn: string;
}

export interface MetricCreationAttributes extends Omit<MetricAttributes, "arn"> {}

export interface MetricUpdateAttributes
	extends Pick<MetricAttributes, "value" | "takenAt" | "takenAtOffset" | "isDeleted" | "metadata"> {}

export class Metric implements MetricAttributes {
	id: string;
	orgId: number;
	region: RegionEnum;
	accountId?: number;
	userId?: number;
	metricCategoryId: number;
	metricTypeId: number;
	metricTypeVersion: number;
	deviceId: number;
	batchId: string;
	relatedToRn?: string;
	value: number;
	takenAt: Date;
	takenAtOffset: number;
	recordedAt: Date;
	metadata: object;
	isDeleted: boolean;

	constructor(
		data: Omit<MetricAttributes, "recordedAt" | "arn"> & {
			recordedAt?: Date;
		}
	) {
		this.id = data.id;
		this.orgId = data.orgId;
		this.region = data.region;
		this.accountId = data.accountId;
		this.userId = data.userId;
		this.metricCategoryId = data.metricCategoryId;
		this.metricTypeId = data.metricTypeId;
		this.metricTypeVersion = data.metricTypeVersion;
		this.deviceId = data.deviceId;
		this.batchId = data.batchId;
		this.relatedToRn = data.relatedToRn;
		this.value = data.value;
		this.takenAt = data.takenAt;
		this.takenAtOffset = data.takenAtOffset;
		this.recordedAt = data.recordedAt;
		this.isDeleted = data.isDeleted;
		this.metadata = data.metadata;
	}

	static get arnPattern(): string {
		return [
			container.resolve("appPrefix"),
			":<region>",
			":<orgId>",
			":<accountId>",
			"/metrics/<metricId>",
		].join("");
	}

	get arn(): string {
		return [
			container.resolve("appPrefix"),
			`:${this.region}`,
			`:${this.orgId}`,
			`:${this.accountId}` || "-",
			`/metrics/${this.id}`,
		].join("");
	}

	toJSON(): MetricAttributes {
		return {
			id: this.id,
			orgId: this.orgId,
			region: this.region,
			accountId: this.accountId,
			userId: this.userId,
			relatedToRn: this.relatedToRn,
			metricCategoryId: this.metricCategoryId,
			metricTypeId: this.metricTypeId,
			metricTypeVersion: this.metricTypeVersion,
			deviceId: this.deviceId,
			batchId: this.batchId,
			value: this.value,
			takenAt: this.takenAt,
			takenAtOffset: this.takenAtOffset,
			recordedAt: this.recordedAt,
			isDeleted: this.isDeleted,
			metadata: this.metadata,
			arn: this.arn,
		};
	}

	/**
	 * Returns metric model by its ID.
	 * Should be implemented in order to resource resolver works properly.
	 * Method signature should be compatible with the sequelize findOne method.
	 */
	public static findOne(params: {
		where: {
			id: string;
		};
	}): Promise<Metric | null> {
		const service = container.resolve<MetricService>("MetricService");
		try {
			return service.read(params.where.id);
		} catch (e) {
			if (e instanceof NotFoundError) {
				return null;
			} else {
				throw e;
			}
		}
	}
}

export default Metric;

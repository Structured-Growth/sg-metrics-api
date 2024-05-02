import { container, RegionEnum } from "@structured-growth/microservice-sdk";

export interface MetricAttributes {
	id: number;
	orgId: number;
	region: RegionEnum;
	accountId?: number;
	userId?: number;
	metricCategoryId: number;
	metricTypeId: number;
	metricTypeVersion: number;
	deviceId: number;
	batchId: string;
	value: number;
	takenAt: Date;
	takenAtOffset: number;
	recordedAt: Date;
	// isActive: boolean;
	arn: string;
}

export interface MetricCreationAttributes extends Omit<MetricAttributes, "id" | "arn" | "recordedAt"> {}

export interface MetricUpdateAttributes extends Pick<MetricAttributes, "isActive"> {}

export class Metric implements MetricAttributes {
	id: number;
	orgId: number;
	region: RegionEnum;
	accountId: number;
	userId: number;
	metricCategoryId: number;
	metricTypeId: number;
	metricTypeVersion: number;
	deviceId: number;
	batchId: string;
	value: number;
	takenAt: Date;
	takenAtOffset: number;
	recordedAt: Date;
	isActive: boolean;

	constructor(
		data: Omit<MetricAttributes, "id" | "recordedAt" | "arn"> & {
			id?: number;
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
		this.value = data.value;
		this.takenAt = data.takenAt;
		this.takenAtOffset = data.takenAtOffset;
		this.recordedAt = data.recordedAt;
		// this.isActive = data.isActive;
	}

	static get arnPattern(): string {
		return [
			container.resolve("appPrefix"),
			"<region>",
			"<orgId>",
			"<accountId>",
			"metric-category/<metricCategoryId>",
			"metric-type/<metricTypeId>",
			"metric/<metricId>",
		].join(":");
	}

	get arn(): string {
		return [
			container.resolve("appPrefix"),
			this.region,
			this.orgId,
			this.accountId || "-",
			`metric-category/${this.metricCategoryId}`,
			`metric-type/${this.metricTypeId}`,
			`metric/${this.id}`,
		].join(":");
	}

	toJSON(): MetricAttributes {
		return {
			id: this.id,
			orgId: this.orgId,
			region: this.region,
			accountId: this.accountId,
			userId: this.userId,
			metricCategoryId: this.metricCategoryId,
			metricTypeId: this.metricTypeId,
			metricTypeVersion: this.metricTypeVersion,
			deviceId: this.deviceId,
			batchId: this.batchId,
			value: this.value,
			takenAt: this.takenAt,
			takenAtOffset: this.takenAtOffset,
			recordedAt: this.recordedAt,
			// isActive: this.isActive,
			arn: this.arn,
		};
	}
}

export default Metric;

import TimestreamWrite from 'aws-sdk/clients/timestreamwrite';
import { container, RegionEnum } from "@structured-growth/microservice-sdk";

export interface MetricAttributes {
	id: number;
	orgId: number;
	region: RegionEnum;
	accountId: number;
	userId: number;
	metricTypeId: number;
	metricTypeVersion: number;
	deviceId: number;
	batchId: string;
	value: number;
	takenAt: Date;
	takenAtOffset: number;
	recordedAt: Date;
}

export interface MetricCreationAttributes extends MetricAttributes {
}

export class Metric implements MetricAttributes {
	id: number;
	orgId: number;
	region: RegionEnum;
	accountId: number;
	userId: number;
	metricTypeId: number;
	metricTypeVersion: number;
	deviceId: number;
	batchId: string;
	value: number;
	takenAt: Date;
	takenAtOffset: number;
	recordedAt: Date;

	constructor(
		data: MetricAttributes,
	) {
		this.id = data.id;
		this.orgId = data.orgId;
		this.region = data.region;
		this.accountId = data.accountId;
		this.userId = data.userId;
		this.metricTypeId = data.metricTypeId;
		this.metricTypeVersion = data.metricTypeVersion;
		this.deviceId = data.deviceId;
		this.batchId = data.batchId;
		this.value = data.value;
		this.takenAt = data.takenAt;
		this.takenAtOffset = data.takenAtOffset;
		this.recordedAt = data.recordedAt;
	}

	static writeToTimestream(metric: Metric) {
		const region = container.resolve("region");
		const timestreamWrite = new TimestreamWrite({
			apiVersion: "2018-11-01",
			region: region,
		});

		const metricData = {
			DatabaseName: 'test',
			TableName: 'YourTableName',
			Records: [
				{
					Dimensions: [
						{ Name: 'orgId', Value: metric.orgId.toString() },
						{ Name: 'region', Value: metric.region },
					],
					MeasureName: 'value',
					MeasureValue: metric.value.toString(),
					MeasureValueType: 'BIGINT',
					Time: metric.recordedAt.getTime().toString(),
					TimeUnit: 'MILLISECONDS',
				},
			],
		};

		timestreamWrite.writeRecords(metricData, (err, data) => {
			if (err) {
				console.error('Error inserting metric:', err);
			} else {
				console.log('Successfully inserted metric:', data);
			}
		});
	}

	toJSON(): MetricAttributes {
		return {
			id: this.id,
			orgId: this.orgId,
			region: this.region,
			accountId: this.accountId,
			userId: this.userId,
			metricTypeId: this.metricTypeId,
			metricTypeVersion: this.metricTypeVersion,
			deviceId: this.deviceId,
			batchId: this.batchId,
			value: this.value,
			takenAt: this.takenAt,
			takenAtOffset: this.takenAtOffset,
			recordedAt: this.recordedAt,
		};
	}
}

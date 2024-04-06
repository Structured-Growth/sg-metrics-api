import { TimestreamWrite } from 'aws-sdk';

export interface MetricAttributes {
	id: number;
	orgId: number;
	region: string;
	accountId: number;
	userId: number;
	metricTypeId: string;
	metricTypeVersion: number;
	deviceId: string;
	batchId: string;
	value: number;
	takenAt: Date;
	takenAtOffset: number;
	recordedAt: Date;
}

export interface MetricCreationAttributes extends Omit<MetricAttributes, "id" | "recordedAt"> {
}

export class Metric {
	id: number;
	orgId: number;
	region: string;
	accountId: number;
	userId: number;
	metricTypeId: string;
	metricTypeVersion: number;
	deviceId: string;
	batchId: string;
	value: number;
	takenAt: Date;
	takenAtOffset: number;
	recordedAt: Date;

	constructor(
		id: number,
		orgId: number,
		region: string,
		accountId: number,
		userId: number,
		metricTypeId: string,
		metricTypeVersion: number,
		deviceId: string,
		batchId: string,
		value: number,
		takenAt: Date,
		takenAtOffset: number,
		recordedAt: Date
	) {
		this.id = id;
		this.orgId = orgId;
		this.region = region;
		this.accountId = accountId;
		this.userId = userId;
		this.metricTypeId = metricTypeId;
		this.metricTypeVersion = metricTypeVersion;
		this.deviceId = deviceId;
		this.batchId = batchId;
		this.value = value;
		this.takenAt = takenAt;
		this.takenAtOffset = takenAtOffset;
		this.recordedAt = recordedAt;
	}

	static writeToTimestream(metric: Metric) {
		const timestreamWrite = new TimestreamWrite();

		const metricData = {
			TableName: 'YourTableName',
			Records: [
				{
					Dimensions: [
						{ Name: 'orgId', Value: metric.orgId.toString() },
						{ Name: 'region', Value: metric.region },
					],
					MeasureName: 'value',
					MeasureValue: metric.value.toString(),
					MeasureValueType: 'DOUBLE',
					Time: metric.takenAt.toISOString(),
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

	toAttributes(): MetricAttributes {
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

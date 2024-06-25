import "../../src/app/providers";
import { App } from "../../src/app/app";
import { container } from "@structured-growth/microservice-sdk";
import { RegionEnum } from "@structured-growth/microservice-sdk";
import { assert } from "chai";
import { initTest } from "../common/init-test";
import { filter, min, uniqBy } from "lodash";
import { MetricAttributes } from "../../database/models/metric";

describe("e2e/aggregation-average", () => {
	const { server, context } = initTest();
	const orgId = Math.round(new Date().getTime() / 1000);
	const region = RegionEnum.US;
	const userIds = [1, 2];
	const deviceIds = [1, 2];
	const startDate = new Date();
	startDate.setDate(startDate.getDate() - 12);

	before(async function () {
		await container.resolve<App>("App").ready;

		const { statusCode: catStatus, body: catBody } = await server.post("/v1/metric-category").send({
			orgId,
			region,
			title: "Medicine",
			code: "test_medicine_" + orgId,
			status: "active",
			metadata: {
				specUrl: "https://",
				countryCode: "test",
			},
		});
		assert.equal(catStatus, 201);
		assert.isNumber(catBody.id);
		context.createdMetricCategoryId = catBody.id;

		const { statusCode: pulseStatus, body: pulseBody } = await server.post("/v1/metric-type").send({
			orgId,
			region,
			metricCategoryId: context.createdMetricCategoryId,
			title: "Pulse",
			code: "test_pulse_" + orgId,
			unit: "bpm",
			factor: 1,
			relatedTo: "medicine",
			version: 1,
			status: "active",
			metadata: {
				specUrl: "https://",
				countryCode: "test",
			},
		});
		assert.equal(pulseStatus, 201);
		assert.isNumber(pulseBody.id);
		context.createdPulseMetricTypeId = pulseBody.id;

		const { statusCode: bpStatus, body: bpBody } = await server.post("/v1/metric-type").send({
			orgId,
			region,
			metricCategoryId: context.createdMetricCategoryId,
			title: "Blood Pressure",
			code: "test_blood_pressure_" + orgId,
			unit: "mmHg",
			factor: 1,
			relatedTo: "medicine",
			version: 1,
			status: "active",
			metadata: {
				specUrl: "https://",
				countryCode: "test",
			},
		});
		assert.equal(bpStatus, 201);
		assert.isNumber(bpBody.id);
		context.createdBloodPressureMetricTypeId = bpBody.id;

		context.metrics = [];

		for (let i = 0; i < 25; i++) {
			const metricValue = Math.floor(Math.random() * 100) + 50;
			const takenAtTime = new Date(startDate);
			takenAtTime.setDate(startDate.getDate() + (i % 12));
			const takenAtFormatted = takenAtTime.toISOString().replace(/\.\d{3}Z$/, "+00:00");
			const userId = userIds[i % userIds.length];
			const deviceId = deviceIds[i % deviceIds.length];
			const metricTypeId = i % 2 === 0 ? context.createdPulseMetricTypeId : context.createdBloodPressureMetricTypeId;

			context.metrics.push({
				orgId,
				region,
				accountId: orgId,
				userId,
				relatedToRn: "medicine",
				metricCategoryId: context.createdMetricCategoryId,
				metricTypeId,
				metricTypeVersion: 1,
				deviceId,
				batchId: `batchId-${Date.now()}`,
				value: metricValue,
				takenAt: takenAtFormatted,
			});
		}

		const { statusCode: metricStatus, body: metricBody } = await server.post("/v1/metrics").send(context.metrics);
		assert.equal(metricStatus, 201);
		context.metrics = metricBody;
	});

	it("Placeholder test to ensure setup works", async () => {
		assert.isNotNull(context.createdMetricCategoryId);
		assert.isNotNull(context.createdPulseMetricTypeId);
		assert.isNotNull(context.createdBloodPressureMetricTypeId);
		assert.isArray(context.metrics);
		assert.equal(context.metrics.length, 25);
	}).timeout(1800000);

	it("Should correctly aggregate metrics by day and return average values", async () => {
		const { statusCode, body } = await server.get(`/v1/metrics/aggregate`).query({
			orgId,
			column: "time",
			columnAggregation: "1d",
			row: "value",
			rowAggregation: "avg",
		});
		assert.equal(statusCode, 200);
		assert.isArray(body.data);
		assert.equal(body.data.length, 12);
		assert.equal(body.data[0].count, 3);
		assert.equal(body.data[1].count, 2);

		console.log("Daily Metrics: ", context.metrics);
		console.log("Daily Metrics Length: ", context.metrics.length);
		console.log("Body: ", body.data);
		console.log("Body length: ", body.data.length);

		const expectedResults = [];
		for (let i = 0; i < 12; i++) {
			const takenAtTime = new Date(startDate);
			takenAtTime.setDate(startDate.getDate() + i);
			const takenAtFormatted = takenAtTime.toISOString().split("T")[0];
			const dailyMetrics = context.metrics.filter((metric) => metric.takenAt.startsWith(takenAtFormatted));
			const dailyAvg = dailyMetrics.reduce((sum, metric) => sum + metric.value, 0) / dailyMetrics.length;

			expectedResults.push({
				takenAt: takenAtFormatted,
				avg: dailyAvg,
			});
		}

		for (let i = 0; i < expectedResults.length; i++) {
			const actualDate = body.data[i].takenAt.split("T")[0];
			assert.equal(actualDate, expectedResults[i].takenAt);
			assert.equal(body.data[i].avg, expectedResults[i].avg);
		}
	});

	it("Should find max userId value", async () => {
		const { statusCode, body } = await server.get(`/v1/metrics/aggregate`).query({
			orgId,
			column: "orgId",
			row: "userId",
			rowAggregation: "max",
		});
		assert.equal(statusCode, 200);
		assert.isArray(body.data);
		assert.equal(body.data.length, 1);
		assert.equal(body.data[0].count, 2);
		assert.equal(body.data[0].max, 2);
	});

	it("Should find min userId value", async () => {
		const { statusCode, body } = await server.get(`/v1/metrics/aggregate`).query({
			orgId,
			column: "orgId",
			row: "userId",
			rowAggregation: "min",
		});
		assert.equal(statusCode, 200);
		assert.isArray(body.data);
		assert.equal(body.data.length, 1);
		assert.equal(body.data[0].count, 2);
		assert.equal(body.data[0].min, 1);
	});

	it("Should find min takenAt for users", async () => {
		const { statusCode, body } = await server.get(`/v1/metrics/aggregate`).query({
			orgId,
			column: "userId",
			row: "time",
			rowAggregation: "min",
		});

		const user1metrics = filter<MetricAttributes>(context.metrics, {userId: 1});
		const min1Date = min(user1metrics.map(metric => new Date(metric.takenAt).getTime()));
		const metric1WithMinDate = user1metrics.find(metric => {
			return new Date(metric.takenAt).getTime() === min1Date;
		});

		const user2metrics = filter<MetricAttributes>(context.metrics, {userId: 2});
		const min2Date = min(user2metrics.map(metric => new Date(metric.takenAt).getTime()));
		const metric2WithMinDate = user2metrics.find(metric => {
			return new Date(metric.takenAt).getTime() === min2Date;
		});

		assert.equal(statusCode, 200);
		assert.isArray(body.data);
		assert.equal(body.data.length, 2);
		assert.equal(body.data[0].count, 13);
		assert.equal(body.data[1].count, 12);
		assert.equal(body.data[0].min, metric1WithMinDate.takenAt);
		assert.equal(body.data[1].min, metric2WithMinDate.takenAt);
	});

	it("Should find aggregate value/value", async () => {
		const { statusCode, body } = await server.get(`/v1/metrics/aggregate`).query({
			orgId,
			column: "value",
			row: "value",
			rowAggregation: "min",
			limit: 100,
		});

		const uniqCount = uniqBy<MetricAttributes>(context.metrics, m => m.value).length;

		assert.equal(statusCode, 200);
		assert.isArray(body.data);
		assert.equal(body.data.length, uniqCount);
	});

	it("Should find min user id", async () => {
		const { statusCode, body } = await server.get(`/v1/metrics/aggregate`).query({
			orgId,
			column: "time",
			columnAggregation: "30d",
			row: "userId",
			rowAggregation: "min",
			limit: 100,
		});

		const uniqCount = uniqBy<MetricAttributes>(context.metrics, m => m.value).length;

		assert.equal(statusCode, 200);
		assert.isArray(body.data);
		assert.equal(body.data[0].min, 1);
	});
});

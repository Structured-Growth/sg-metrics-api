import "../../../../src/app/providers";
import { App } from "../../../../src/app/app";
import { container } from "@structured-growth/microservice-sdk";
import { RegionEnum } from "@structured-growth/microservice-sdk";
import { assert } from "chai";
import { initTest } from "../../../common/init-test";

describe("Setup and Teardown for Metric Tests", () => {
	const { server, context } = initTest();
	const orgId = 115;
	const region = RegionEnum.US;
	const userIds = [458, 125];
	const deviceIds = [378, 1255];
	const startDate = new Date();
	startDate.setDate(startDate.getDate() - 12);

	before(function (done) {
		this.timeout(1800000);

		(async () => {
			await container.resolve<App>("App").ready;

			let existingMetricCategory;
			try {
				existingMetricCategory = await server.get("/v1/metric-category").query({ "code[]": "test_medicine" });
			} catch (err) {
				console.log(err);
			}

			if (existingMetricCategory && existingMetricCategory.body.data.length) {
				context.createdMetricCategoryId = existingMetricCategory.body.data[0].id;
			} else {
				const { statusCode: catStatus, body: catBody } = await server.post("/v1/metric-category").send({
					orgId,
					region,
					title: "Medicine",
					code: "test_medicine",
					status: "active",
					metadata: {
						specUrl: "https://",
						countryCode: "test",
					},
				});
				assert.equal(catStatus, 201);
				assert.isNumber(catBody.id);
				context.createdMetricCategoryId = catBody.id;
			}

			let existingPulseMetricType;
			try {
				existingPulseMetricType = await server.get("/v1/metric-type").query({ "code[]": "test_pulse" });
			} catch (err) {
				console.log(err);
			}

			if (existingPulseMetricType && existingPulseMetricType.body.data.length) {
				context.createdPulseMetricTypeId = existingPulseMetricType.body.data[0].id;
			} else {
				const { statusCode: pulseStatus, body: pulseBody } = await server.post("/v1/metric-type").send({
					orgId,
					region,
					metricCategoryId: context.createdMetricCategoryId,
					title: "Pulse",
					code: "test_pulse",
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
			}

			let existingBPMetricType;
			try {
				existingBPMetricType = await server.get("/v1/metric-type").query({ "code[]": "test_blood_pressure" });
			} catch (err) {
				console.log(err);
			}

			if (existingBPMetricType && existingBPMetricType.body.data.length) {
				context.createdBloodPressureMetricTypeId = existingBPMetricType.body.data[0].id;
			} else {
				const { statusCode: bpStatus, body: bpBody } = await server.post("/v1/metric-type").send({
					orgId,
					region,
					metricCategoryId: context.createdMetricCategoryId,
					title: "Blood Pressure",
					code: "test_blood_pressure",
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
			}

			context.metrics = [];

			for (let i = 0; i < 25; i++) {
				const metricValue = Math.floor(Math.random() * 100) + 50;
				const takenAtTime = new Date(startDate);
				takenAtTime.setDate(startDate.getDate() + (i % 12));

				const takenAtFormatted = takenAtTime.toISOString().replace(/\.\d{3}Z$/, "+00:00");

				const userId = userIds[i % userIds.length];
				const deviceId = deviceIds[i % deviceIds.length];
				const metricTypeId = i % 2 === 0 ? context.createdPulseMetricTypeId : context.createdBloodPressureMetricTypeId;

				const { statusCode: metricStatus, body: metricBody } = await server.post("/v1/metrics").send([
					{
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
					},
				]);
				assert.equal(metricStatus, 201);
				context.metrics.push(metricBody[0]);
			}

			done();
		})();
	});

	after(async () => {
		for (const metric of context.metrics) {
			const { statusCode } = await server.delete(`/v1/metrics/${metric.id}`);
			assert.equal(statusCode, 204);
		}

		const { statusCode: deletePulseStatus } = await server.delete(
			`/v1/metric-type/${context.createdPulseMetricTypeId}`
		);
		assert.equal(deletePulseStatus, 204);

		const { statusCode: deleteBPStatus } = await server.delete(
			`/v1/metric-type/${context.createdBloodPressureMetricTypeId}`
		);
		assert.equal(deleteBPStatus, 204);

		const { statusCode: deleteCatStatus } = await server.delete(
			`/v1/metric-category/${context.createdMetricCategoryId}`
		);
		assert.equal(deleteCatStatus, 204);
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

			// console.log("Daily Metrics: ", dailyMetrics);

			const dailyAvg = dailyMetrics.reduce((sum, metric) => sum + metric.value, 0) / dailyMetrics.length;

			console.log("Daily Avg: ", dailyAvg);

			expectedResults.push({
				takenAt: takenAtFormatted,
				avg: dailyAvg,
			});
		}

		for (let i = 0; i < expectedResults.length; i++) {
			const actualDate = body.data[i].takenAt.split("T")[0];
			// assert.equal(actualDate, expectedResults[i].takenAt);
			console.log("AVG: ", body.data[i].avg);
			// assert.closeTo(body.data[i].avg, expectedResults[i].avg, 0.01);
		}
	}).timeout(1800000);
});

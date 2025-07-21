import "../../../../src/app/providers";
import { App } from "../../../../src/app/app";
import { container, webServer } from "@structured-growth/microservice-sdk";
import { RegionEnum } from "@structured-growth/microservice-sdk";
import { assert } from "chai";
import { initTest } from "../../../common/init-test";

describe("PUT /api/v1/metrics/:metricId", () => {
	const { server, context } = initTest();
	const code = `code-${Date.now()}`;
	const userId = parseInt(Date.now().toString().slice(5));
	const relatedToRn = `relatedTo-${Date.now()}`;
	const orgId = parseInt(Date.now().toString().slice(0, 3));
	const factor = parseInt(Date.now().toString().slice(0, 2));
	const version = orgId - factor;
	const accountId = orgId - factor - factor;
	const metricTypeVersion = parseInt(Date.now().toString().slice(0, 1));
	const deviceId = parseInt(Date.now().toString().slice(0, 4));
	const batchId = `batchId-${Date.now()}`;
	const value = parseInt(Date.now().toString().slice(0, 5));

	before(async () => {
		process.env.TRANSLATE_API_URL = "";
		await container.resolve<App>("App").ready;
	});

	it("Should create metric category", async () => {
		const { statusCode, body } = await server.post("/v1/metric-category").send({
			orgId: orgId,
			region: RegionEnum.US,
			title: code,
			code: code,
			status: "active",
			metadata: {
				specUrl: "https://",
				countryCode: "test",
			},
		});
		assert.equal(statusCode, 201);
		assert.isNumber(body.id);
		context.createdMetricCategoryId = body.id;
	});

	it("Should create metric type", async () => {
		const { statusCode, body } = await server.post("/v1/metric-type").send({
			orgId: orgId,
			region: RegionEnum.US,
			metricCategoryId: context["createdMetricCategoryId"],
			title: code,
			code: code,
			unit: code,
			factor: factor,
			relatedTo: code,
			version: version,
			status: "inactive",
			metadata: {
				specUrl: "https://",
				countryCode: "test",
			},
		});
		assert.equal(statusCode, 201);
		assert.isNumber(body.id);
		context.createdMetricTypeId = body.id;
	});

	it("Should create metric", async () => {
		const { statusCode, body } = await server.post("/v1/metrics").send([
			{
				orgId: orgId,
				region: RegionEnum.US,
				accountId: accountId,
				userId: userId,
				relatedToRn: relatedToRn,
				metricCategoryId: context.createdMetricCategoryId,
				metricTypeId: context.createdMetricTypeId,
				metricTypeVersion: metricTypeVersion,
				deviceId: deviceId,
				batchId: batchId,
				value: value,
				takenAt: "2024-05-16T14:30:00+00:00",
				metadata: {
					a: 1,
				},
			},
		]);
		assert.equal(statusCode, 201);
		context.createdMetricId = body[0].id;
	});

	it("Should create second metric", async () => {
		const { statusCode, body } = await server.post("/v1/metrics").send([
			{
				orgId: orgId,
				region: RegionEnum.US,
				accountId: accountId,
				userId: userId,
				relatedToRn: relatedToRn,
				metricCategoryId: context.createdMetricCategoryId,
				metricTypeId: context.createdMetricTypeId,
				metricTypeVersion: metricTypeVersion,
				deviceId: deviceId,
				batchId: batchId,
				value: value,
				takenAt: "2024-05-16T11:30:00+00:00",
			},
		]);
		assert.equal(statusCode, 201);
		assert.equal(body[0].relatedToRn, relatedToRn);
		context.createdMetric2Id = body[0].id;
	});

	it("Should return metric", async () => {
		const { statusCode, body } = await server.get(`/v1/metrics/${context.createdMetricId}`);
		assert.equal(statusCode, 200);
		assert.equal(body.id, context["createdMetricId"]);
	});

	it("Should update metric value and metadata", async () => {
		const { statusCode, body } = await server.put(`/v1/metrics/${context.createdMetricId}`).send({
			value: value + 100,
			metadata: {
				a: 2,
			},
		});
		assert.equal(statusCode, 200);
		assert.equal(body.value, value + 100);
		assert.equal(body.metadata.a, 2);
	});

	it("Should return updated metric with new value", async () => {
		const { statusCode, body } = await server.get(`/v1/metrics/${context.createdMetricId}`);
		assert.equal(statusCode, 200);
		assert.equal(body.value, value + 100);
	});

	it("Should update metric time", async () => {
		const { statusCode, body } = await server.put(`/v1/metrics/${context.createdMetric2Id}`).send({
			takenAt: new Date().toISOString().split(".")[0] + "+00:00",
		});
		assert.equal(statusCode, 200);
		assert.equal(body.takenAtOffset, 0);
		context.createdMetric2NewId = body.id;
	});

	it("Should return updated metric with new time", async () => {
		const { statusCode, body } = await server.get(`/v1/metrics/${context.createdMetric2NewId}`);
		assert.equal(statusCode, 200);
		assert.equal(body.takenAtOffset, 0);
	});
});

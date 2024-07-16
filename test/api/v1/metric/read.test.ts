import "../../../../src/app/providers";
import { App } from "../../../../src/app/app";
import { container, webServer } from "@structured-growth/microservice-sdk";
import { RegionEnum } from "@structured-growth/microservice-sdk";
import { assert } from "chai";
import { initTest } from "../../../common/init-test";

describe("GET /api/v1/metrics:metricId", () => {
	const { server, context } = initTest();
	const code = `code-${Date.now()}`;
	const userId = parseInt(Date.now().toString().slice(3));
	const relatedToRn = `relatedTo-${Date.now()}`;
	const orgId = parseInt(Date.now().toString().slice(0, 3));
	const factor = parseInt(Date.now().toString().slice(0, 2));
	const version = orgId - factor;
	const accountId = orgId - factor - factor;
	const metricTypeVersion = parseInt(Date.now().toString().slice(0, 1));
	const deviceId = parseInt(Date.now().toString().slice(0, 4));
	const batchId = `batchId-${Date.now()}`;
	const value = parseInt(Date.now().toString().slice(0, 5));
	const takenAtOffset = 90;

	before(async () => container.resolve<App>("App").ready);

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
				takenAt: "2024-05-16T14:30:00+01:00",
			},
		]);
		assert.equal(statusCode, 201);
		assert.equal(body[0].relatedToRn, relatedToRn);
		context.createdMetricId = body[0].id;
	});

	it("Should return metric", async () => {
		const { statusCode, body } = await server.get(`/v1/metrics/${context.createdMetricId}`).send({});
		assert.equal(statusCode, 200);
		assert.equal(body.id, context["createdMetricId"]);
		assert.equal(body.orgId, orgId);
		assert.equal(body.region, "us");
		assert.equal(body.accountId, accountId);
		assert.equal(body.userId, userId);
		assert.equal(body.relatedToRn, relatedToRn);
		assert.equal(body.metricCategoryId, context["createdMetricCategoryId"]);
		assert.equal(body.metricTypeId, context["createdMetricTypeId"]);
		assert.equal(body.metricTypeVersion, metricTypeVersion);
		assert.equal(body.deviceId, deviceId);
		assert.equal(body.batchId, batchId);
		assert.equal(body.value, value);
		assert.equal(body.takenAt, "2024-05-16T13:30:00.000Z");
		assert.equal(body.takenAtOffset, 60);
		assert.isString(body.recordedAt);
	}).timeout(1800000);

	it("Should return error is metric type id is wrong", async () => {
		const { statusCode, body } = await server.get(`/v1/metrics/9999`).send({});
		assert.equal(statusCode, 404);
		assert.isString(body.message);
	}).timeout(1800000);
});

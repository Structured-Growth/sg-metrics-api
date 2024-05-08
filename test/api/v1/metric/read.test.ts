import "../../../../src/app/providers";
import { App } from "../../../../src/app/app";
import { container, webServer } from "@structured-growth/microservice-sdk";
import { RegionEnum } from "@structured-growth/microservice-sdk";
import {assert} from "chai";
import {initTest} from "../../../common/init-test";

describe("GET /api/v1/metrics:metricId", () => {
	const { server, context } = initTest();
	const code = `code-${Date.now()}`;


	before(async () => container.resolve<App>("App").ready);

	it("Should create metric category", async () => {
		const { statusCode, body } = await server.post("/v1/metric-category").send({
			orgId: 1,
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
			orgId: 1,
			region: RegionEnum.US,
			metricCategoryId: context["createdMetricCategoryId"],
			title: code,
			code: code,
			unit: code,
			factor: 1,
			relatedTo: code,
			version: 1,
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
		const { statusCode, body } = await server.post("/v1/metrics").send({
			orgId: 1,
			accountId: 13,
			userId: 88,
			metricCategoryId: context["createdMetricCategoryId"],
			metricTypeId: context["createdMetricTypeId"],
			metricTypeVersion: 2,
			deviceId: 101,
			batchId: "123456",
			value: 35,
			takenAt: "2024-05-06T14:30:00+00:00",
			takenAtOffset: 90,
		});
		assert.equal(statusCode, 201);
		context.createdMetricId = body.id;
	});

	it("Should return metric", async () => {
		const { statusCode, body } = await server.get(`/v1/metrics/${context.createdMetricId}`).send({
		});
		assert.equal(statusCode, 200);
		assert.equal(body.id, context["createdMetricId"]);
		assert.equal(body.orgId, 1);
		assert.equal(body.accountId, 13);
		assert.equal(body.userId, 88);
		assert.equal(body.metricCategoryId, context["createdMetricCategoryId"]);
		assert.equal(body.metricTypeId, context["createdMetricTypeId"]);
		assert.equal(body.metricTypeVersion, 2);
		assert.equal(body.deviceId, 101);
		assert.equal(body.batchId,"123456");
		assert.equal(body.value, 35);
		assert.equal(body.takenAt, "2024-05-06T14:30:00.000Z");
		assert.equal(body.takenAtOffset, 90);
		assert.isString(body.recordedAt);
	});

	it("Should return error is metric type id is wrong", async () => {
		const { statusCode, body } = await server.get(`/v1/metrics/9999`).send({
		});
		assert.equal(statusCode, 404);
		assert.isString(body.message);
	});
});

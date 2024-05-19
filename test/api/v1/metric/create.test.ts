import "../../../../src/app/providers";
import { App } from "../../../../src/app/app";
import { container, webServer } from "@structured-growth/microservice-sdk";
import { agent } from "supertest";
import { routes } from "../../../../src/routes";
import { RegionEnum } from "@structured-growth/microservice-sdk";
import {assert} from "chai";
import {initTest} from "../../../common/init-test";

describe("POST /api/v1/metrics", () => {
	const { server, context } = initTest();
	const code = `code-${Date.now()}`;
	const userId = Date.now();

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

	});

	it("Should create metric type", async () => {
		const { statusCode, body } = await server.post("/v1/metric-type").send({
			orgId: 1,
			region: RegionEnum.US,
			metricCategoryId: 1,
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
	});

	it("Should create metric", async () => {
		const { statusCode, body } = await server.post("/v1/metrics").send([
			{
			orgId: 1,
			accountId: 2,
			userId: userId,
			metricCategoryId: 13,
			metricTypeId: 14,
			metricTypeVersion: 10,
			deviceId: 101,
			batchId: "123456",
			value: 35,
			takenAt: "2024-05-06T14:30:00+00:00",
			takenAtOffset: 90,
		}
		]);
		assert.equal(statusCode, 201);
		assert.equal(body[0].orgId, 1);
		assert.equal(body[0].accountId, 2);
		assert.equal(body[0].userId, userId);
		assert.equal(body[0].metricCategoryId, 13);
		assert.equal(body[0].metricTypeId, 14);
		assert.equal(body[0].metricTypeVersion, 10);
		assert.equal(body[0].deviceId, 101);
		assert.equal(body[0].batchId, "123456");
		assert.equal(body[0].value, 35);
		assert.isString(body[0].takenAt);
		assert.equal(body[0].takenAtOffset, 90);
		assert.isString(body[0].arn);
		context.createdMetricId = body[0].id;
	});

	it("Should return validation error", async () => {
		const { statusCode, body } = await server.post("/v1/metrics").send([
			{
			orgId: "main",
			accountId: -1,
			userId: -2,
			metricCategoryId: -3,
			metricTypeId: -4,
			metricTypeVersion: -5,
			deviceId: "abc",
			batchId: -1,
			value: "bad",
			takenAt: "now",
			takenAtOffset: "kk",
		}
		]);
		assert.equal(statusCode, 422);
		assert.isDefined(body.validation);
		assert.isString(body.message);
		assert.isString(body.validation.body[0].orgId[0]);
		assert.isString(body.validation.body[0].accountId[0]);
		assert.isString(body.validation.body[0].userId[0]);
		assert.isString(body.validation.body[0].metricCategoryId[0]);
		assert.isString(body.validation.body[0].metricTypeId[0]);
		assert.isString(body.validation.body[0].metricTypeVersion[0]);
		assert.isString(body.validation.body[0].deviceId[0]);
		assert.isString(body.validation.body[0].batchId[0]);
		assert.isString(body.validation.body[0].value[0]);
		assert.isString(body.validation.body[0].takenAt[0]);
		assert.isString(body.validation.body[0].takenAtOffset[0]);

	});
});

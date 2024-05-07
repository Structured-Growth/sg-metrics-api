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
		const { statusCode, body } = await server.post("/v1/metrics").send({
			orgId: 1,
			accountId: 1,
			userId: 1,
			metricCategoryId: 1,
			metricTypeId: 1,
			metricTypeVersion: 1,
			deviceId: 101,
			batchId: "123456",
			value: 35,
			takenAt: "2024-05-06T14:30:00+00:00",
			takenAtOffset: 90,
		});
		assert.equal(statusCode, 201);
		assert.equal(body.orgId, 1);
		assert.equal(body.accountId, 1);
		assert.equal(body.userId, 1);
		assert.equal(body.metricCategoryId, 1);
		assert.equal(body.metricTypeId, 1);
		assert.equal(body.metricTypeVersion, 1);
		assert.equal(body.deviceId, 101);
		assert.equal(body.batchId, "123456");
		assert.equal(body.value, 35);
		assert.isString(body.takenAt);
		assert.equal(body.takenAtOffset, 90);
		assert.isString(body.arn);
	});

	it("Should return validation error", async () => {
		const { statusCode, body } = await server.post("/v1/metrics").send({
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
		});
		assert.equal(statusCode, 422);
		assert.isDefined(body.validation);
		assert.isString(body.message);
		assert.isString(body.validation.body.orgId[0]);
		assert.isString(body.validation.body.accountId[0]);
		assert.isString(body.validation.body.userId[0]);
		assert.isString(body.validation.body.metricCategoryId[0]);
		assert.isString(body.validation.body.metricTypeId[0]);
		assert.isString(body.validation.body.metricTypeVersion[0]);
		assert.isString(body.validation.body.deviceId[0]);
		assert.isString(body.validation.body.batchId[0]);
		assert.isString(body.validation.body.value[0]);
		assert.isString(body.validation.body.takenAt[0]);
		assert.isString(body.validation.body.takenAtOffset[0]);

	});
});

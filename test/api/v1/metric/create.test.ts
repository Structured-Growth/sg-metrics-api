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
	const orgId = parseInt(Date.now().toString().slice(0, 3));
	const factor = parseInt(Date.now().toString().slice(0, 2));
	const version = orgId - factor;
	const accountId = orgId - factor - factor;
	const metricTypeVersion = parseInt(Date.now().toString().slice(0, 2));
	const deviceId = version - accountId;
	const batchId = `batchId-${Date.now()}`;
	const value = metricTypeVersion - factor;
	const takenAtOffset = metricTypeVersion + factor;

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
			metricCategoryId: context.createdMetricCategoryId,
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
			accountId: accountId,
			userId: userId,
			metricCategoryId: context.createdMetricCategoryId,
			metricTypeId: context.createdMetricTypeId,
			metricTypeVersion: metricTypeVersion,
			deviceId: deviceId,
			batchId: batchId,
			value: value,
			takenAt: "2024-05-16T14:30:00+00:00",
			takenAtOffset: takenAtOffset,
		}
		]);
		assert.equal(statusCode, 201);
		assert.equal(body[0].orgId, orgId);
		assert.equal(body[0].accountId, accountId);
		assert.equal(body[0].userId, userId);
		assert.equal(body[0].metricCategoryId, context["createdMetricCategoryId"]);
		assert.equal(body[0].metricTypeId, context["createdMetricTypeId"]);
		assert.equal(body[0].metricTypeVersion, metricTypeVersion);
		assert.equal(body[0].deviceId, deviceId);
		assert.equal(body[0].batchId, batchId);
		assert.equal(body[0].value, value);
		assert.isString(body[0].takenAt);
		assert.equal(body[0].takenAtOffset, takenAtOffset);
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

import "../../../../src/app/providers";
import { assert } from "chai";
import { initTest } from "../../../common/init-test";
import {RegionEnum, webServer} from "@structured-growth/microservice-sdk";
import {container} from "@structured-growth/microservice-sdk";
import {App} from "../../../../src/app/app";

describe("GET /api/v1/metric-type:metricTypeId", () => {
	const { server, context } = initTest();
	const code = `code-${Date.now()}`;
	const orgId = parseInt(Date.now().toString().slice(0, 3));
	const factor = parseInt(Date.now().toString().slice(0, 2));
	const version = orgId - factor;
	const accountId = orgId - factor - factor;

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
			accountId: accountId,
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

	it("Should return metric type", async () => {
		const { statusCode, body } = await server.get(`/v1/metric-type/${context.createdMetricTypeId}`).send({
			MetricTypeId: context["createdMetricTypeId"]
		});
		assert.equal(statusCode, 200);
		assert.isNumber(body.id);
		assert.isString(body.createdAt);
		assert.isString(body.updatedAt);
		assert.equal(body.orgId, orgId);
		assert.equal(body.accountId, accountId);
		assert.equal(body.region, "us");
		assert.isString(body.title, code);
		assert.isString(body.unit, code);
		assert.equal(body.factor, factor);
		assert.isString(body.relatedTo, code);
		assert.equal(body.version, version);
		assert.equal(body.status, "inactive");
		assert.isString(body.arn);
	});

	it("Should return error is metric type id is wrong", async () => {
		const { statusCode, body } = await server.get(`/v1/metric-type/9999`).send({
			MetricTypeId: "9999"
		});
		assert.equal(statusCode, 404);
		assert.isString(body.message);
	});
});

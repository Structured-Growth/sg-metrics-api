import "../../../../src/app/providers";
import { assert } from "chai";
import { initTest } from "../../../common/init-test";
import {RegionEnum, webServer} from "@structured-growth/microservice-sdk";
import {container} from "@structured-growth/microservice-sdk";
import {App} from "../../../../src/app/app";

describe("GET /api/v1/metric-type:metricTypeId", () => {
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

	it("Should return metric type", async () => {
		const { statusCode, body } = await server.get(`/v1/metric-type/${context.createdMetricTypeId}`).send({
			MetricTypeId: context["createdMetricTypeId"]
		});
		assert.equal(statusCode, 200);
		assert.isNumber(body.id);
		assert.isString(body.createdAt);
		assert.isString(body.updatedAt);
		assert.equal(body.orgId, 1);
		assert.equal(body.region, "us");
		assert.isString(body.title, code);
		assert.isString(body.unit, code);
		assert.equal(body.factor, 1);
		assert.isString(body.relatedTo, code);
		assert.equal(body.version, 1);
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

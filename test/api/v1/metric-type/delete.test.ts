import "../../../../src/app/providers";
import { assert } from "chai";
import { initTest } from "../../../common/init-test";
import {RegionEnum} from "@structured-growth/microservice-sdk";

describe("DELETE /api/v1/metric-type/:metricTypeId", () => {
	const { server, context } = initTest();
	const code = `code-${Date.now()}`;

	it("Should create metric type", async () => {
		const { statusCode, body } = await server.post("/v1/metric-type").send({
			orgId: 2,
			region: RegionEnum.US,
			metricCategoryId: 2,
			title: code,
			code: code,
			unit: code,
			factor: 2,
			relatedTo: code,
			version: 2,
			status: "active",
			metadata: {
				specUrl: "https://",
				countryCode: "test",
			},
		});
		assert.equal(statusCode, 201);
		assert.isNumber(body.id);
		assert.isString(body.createdAt);
		assert.isString(body.updatedAt);
		assert.equal(body.region, "us");
		assert.isString(body.title, code);
		assert.isString(body.unit, code);
		assert.equal(body.factor, 2);
		assert.isString(body.relatedTo, code);
		assert.equal(body.version, 2);
		assert.equal(body.status, "active");
		assert.isString(body.arn);
		context.createdMetricTypeId = body.id;
	});
	it("Should return metric type", async () => {
		const { statusCode, body } = await server.get(`/v1/metric-type/${context.createdMetricTypeId}`).send({
			MetricTypeId: context["createdMetricTypeId"]
		});
		assert.equal(statusCode, 200);
	});

	it("Should delete metric type", async () => {
		const { statusCode, body } = await server.delete(`/v1/metric-type/${context.createdMetricTypeId}`);
		assert.equal(statusCode, 204);
	});

	it("Should return error if metric type does not exist and delete was successful", async () => {
		const { statusCode, body } = await server.delete(`/v1/metric-type/${context.createdMetricTypeId}`);
		assert.equal(statusCode, 404);
		assert.equal(body.name, "NotFound");
		assert.isString(body.message);
	});

	it("Should return validation error if id is wrong", async () => {
		const { statusCode, body } = await server.delete("/v1/metric-type/main");
		assert.equal(statusCode, 422);
		assert.isString(body.message);
	});
});

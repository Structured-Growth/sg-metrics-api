import "../../../../src/app/providers";
import { assert } from "chai";
import { initTest } from "../../../common/init-test";
import {RegionEnum} from "@structured-growth/microservice-sdk";
import {container} from "@structured-growth/microservice-sdk";
import {App} from "../../../../src/app/app";

describe("DELETE /api/v1/metric-type/:metricTypeId", () => {
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
		context.createdMetricTypeId = body.id;
	});

	it("Should return metric type", async () => {
		const { statusCode, body } = await server.get(`/v1/metric-type/${context.createdMetricTypeId}`).send({
			MetricTypeId: context["createdMetricTypeId"]
		});
		assert.equal(statusCode, 200);
		assert.isNumber(body.id);

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
		const { statusCode, body } = await server.delete("/v1/metric-type/9999");
		assert.equal(statusCode, 404);
		assert.isString(body.message);
	});
});

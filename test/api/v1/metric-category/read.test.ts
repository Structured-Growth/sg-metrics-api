import "../../../../src/app/providers";
import { assert } from "chai";
import { initTest } from "../../../common/init-test";
import {RegionEnum, webServer} from "@structured-growth/microservice-sdk";

describe("GET /api/v1/metric-category:metricCategoryId", () => {
	const { server, context } = initTest();
	const code = `code-${Date.now()}`;

	it("Should create metric category", async () => {
		const { statusCode, body } = await server.post("/v1/metric-category").send({
			orgId: 3,
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
	it("Should return metric category", async () => {
		const { statusCode, body } = await server.get(`/v1/metric-category/${context.createdMetricCategoryId}`).send({
			MetricCategoryId: context["createdMetricCategoryId"]
		});
		assert.equal(statusCode, 200);
	});

	it("Should return error is metric category id is wrong", async () => {
		const { statusCode, body } = await server.get(`/v1/metric-category/a`).send({
			MetricCategoryId: "a"
		});
		assert.equal(statusCode, 422);
		assert.isString(body.message);
	});
});

import "../../../../src/app/providers";
import { assert } from "chai";
import { initTest } from "../../../common/init-test";
import {RegionEnum, webServer} from "@structured-growth/microservice-sdk";

describe("GET /api/v1/metric-category:metricCategoryId", () => {
	const { server, context } = initTest();
	const code = `code-${Date.now()}`;
	const orgId = parseInt(Date.now().toString().slice(0, 3));

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

	it("Should return metric category", async () => {
		const { statusCode, body } = await server.get(`/v1/metric-category/${context.createdMetricCategoryId}`);
		assert.equal(statusCode, 200);
		assert.equal(body.id, context["createdMetricCategoryId"]);
		assert.equal(body.orgId, orgId);
		assert.isString(body.createdAt);
		assert.isString(body.updatedAt);
		assert.equal(body.region, "us");
		assert.equal(body.code, code);
		assert.isString(body.title, code);
		assert.equal(body.status, "active");
		assert.isString(body.arn);
	});

	it("Should return error is metric category id is wrong", async () => {
		const { statusCode, body } = await server.get(`/v1/metric-category/9999`).send({
			MetricCategoryId: "a"
		});
		assert.equal(statusCode, 404);
		assert.isString(body.message);
	});
});

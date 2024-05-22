import "../../../../src/app/providers";
import { assert } from "chai";
import { initTest } from "../../../common/init-test";
import {RegionEnum} from "@structured-growth/microservice-sdk";

describe("DELETE /api/v1/metric-category/:metricCategoryId", () => {
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

	it("Should delete metric category", async () => {
		const { statusCode, body } = await server.delete(`/v1/metric-category/${context.createdMetricCategoryId}`);
		assert.equal(statusCode, 204);
	});

	it("Should return error if metric category does not exist and delete was successful", async () => {
		const { statusCode, body } = await server.delete(`/v1/metric-category/${context.createdMetricCategoryId}`);
		assert.equal(statusCode, 404);
		assert.equal(body.name, "NotFound");
		assert.isString(body.message);
	});

	it("Should return validation error if id is wrong", async () => {
		const { statusCode, body } = await server.delete("/v1/metric-category/9999");
		assert.equal(statusCode, 404);
		assert.isString(body.message);
	});
});

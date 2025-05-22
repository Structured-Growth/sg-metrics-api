import "../../../../src/app/providers";
import { assert } from "chai";
import { initTest } from "../../../common/init-test";
import { RegionEnum } from "@structured-growth/microservice-sdk";

describe("DELETE /api/v1/metric-category/:metricCategoryId", () => {
	const { server, context } = initTest();
	const code = `code-${Date.now()}`;
	const orgId = parseInt(Date.now().toString().slice(0, 3));
	const factor = parseInt(Date.now().toString().slice(0, 2));
	const version = orgId - factor;

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
	}).timeout(1800000);

	it("Should create second metric category", async () => {
		const { statusCode, body } = await server.post("/v1/metric-category").send({
			orgId: orgId,
			region: RegionEnum.US,
			title: code,
			code: code + "-second",
			status: "active",
			metadata: {
				specUrl: "https://",
				countryCode: "test",
			},
		});
		assert.equal(statusCode, 201);
		assert.isNumber(body.id);
		context.createdMetricCategory2Id = body.id;
	}).timeout(1800000);

	it("Should create metric type", async () => {
		const { statusCode, body } = await server.post("/v1/metric-type").send({
			orgId: orgId,
			region: RegionEnum.US,
			metricCategoryId: context["createdMetricCategory2Id"],
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
	}).timeout(1800000);

	it("Should delete metric category", async () => {
		const { statusCode, body } = await server.delete(`/v1/metric-category/${context.createdMetricCategoryId}`);
		assert.equal(statusCode, 204);
	}).timeout(1800000);

	it("Should return error during deletion -  metric category has metric type", async () => {
		const { statusCode, body } = await server.delete(`/v1/metric-category/${context.createdMetricCategory2Id}`);
		assert.equal(statusCode, 422);
		assert.isDefined(body.validation);
		assert.isString(body.message);
	}).timeout(1800000);

	it("Should return error if metric category does not exist and delete was successful", async () => {
		const { statusCode, body } = await server.delete(`/v1/metric-category/${context.createdMetricCategoryId}`);
		assert.equal(statusCode, 404);
		assert.equal(body.name, "NotFound");
		assert.isString(body.message);
	}).timeout(1800000);

	it("Should return validation error if id is wrong", async () => {
		const { statusCode, body } = await server.delete("/v1/metric-category/9999");
		assert.equal(statusCode, 404);
		assert.isString(body.message);
	}).timeout(1800000);
});

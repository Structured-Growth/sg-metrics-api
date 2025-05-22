import "../../../../src/app/providers";
import { assert } from "chai";
import { initTest } from "../../../common/init-test";
import { RegionEnum } from "@structured-growth/microservice-sdk";
import { container } from "@structured-growth/microservice-sdk";
import { App } from "../../../../src/app/app";

describe("DELETE /api/v1/metric-type/:metricTypeId", () => {
	const { server, context } = initTest();
	const code = `code-${Date.now()}`;
	const userId = parseInt(Date.now().toString().slice(5));
	const orgId = parseInt(Date.now().toString().slice(0, 3));
	const factor = parseInt(Date.now().toString().slice(0, 2));
	const version = orgId - factor;
	const accountId = orgId - factor - factor;
	const metricTypeVersion = parseInt(Date.now().toString().slice(0, 1));
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
	}).timeout(1800000);

	it("Should create metric type", async () => {
		const { statusCode, body } = await server.post("/v1/metric-type").send({
			orgId: orgId,
			region: RegionEnum.US,
			metricCategoryId: context["createdMetricCategoryId"],
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

	it("Should create second  metric type", async () => {
		const { statusCode, body } = await server.post("/v1/metric-type").send({
			orgId: orgId,
			region: RegionEnum.US,
			metricCategoryId: context["createdMetricCategoryId"],
			title: code,
			code: code + "2",
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
		context.createdMetricType2Id = body.id;
	}).timeout(1800000);

	it("Should create metric", async () => {
		const { statusCode, body } = await server.post("/v1/metrics").send([
			{
				orgId: orgId,
				region: RegionEnum.US,
				accountId: accountId,
				userId: userId,
				metricCategoryId: context.createdMetricCategoryId,
				metricTypeId: context.createdMetricType2Id,
				metricTypeVersion: metricTypeVersion,
				deviceId: deviceId,
				batchId: batchId,
				value: value,
				takenAt: "2024-05-16T14:30:00+00:00",
				takenAtOffset: takenAtOffset,
			},
		]);
		assert.equal(statusCode, 201);
	}).timeout(1800000);

	it("Should return metric type", async () => {
		const { statusCode, body } = await server.get(`/v1/metric-type/${context.createdMetricTypeId}`).send({
			MetricTypeId: context["createdMetricTypeId"],
		});
		assert.equal(statusCode, 200);
		assert.isNumber(body.id);
	}).timeout(1800000);

	it("Should return error because metric type is not empty", async function () {
		const { statusCode, body } = await server.delete(`/v1/metric-type/${context.createdMetricType2Id}`);
		assert.equal(statusCode, 422);
		assert.isDefined(body.validation);
		assert.isString(body.message);
	}).timeout(10000);

	it("Should delete metric type", async () => {
		const { statusCode, body } = await server.delete(`/v1/metric-type/${context.createdMetricTypeId}`);
		assert.equal(statusCode, 204);
	}).timeout(1800000);

	it("Should return error because metric type was deleted", async () => {
		const { statusCode, body } = await server.get(`/v1/metric-type/${context.createdMetricTypeId}`).send({
			MetricTypeId: context["createdMetricTypeId"],
		});
		assert.equal(statusCode, 404);
		assert.isString(body.message);
	}).timeout(1800000);

	it("Should return validation error if id is wrong", async () => {
		const { statusCode, body } = await server.delete("/v1/metric-type/9999");
		assert.equal(statusCode, 404);
		assert.isString(body.message);
	}).timeout(1800000);
});

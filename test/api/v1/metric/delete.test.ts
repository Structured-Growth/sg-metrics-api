import "../../../../src/app/providers";
import { App } from "../../../../src/app/app";
import { container } from "@structured-growth/microservice-sdk";
import { RegionEnum } from "@structured-growth/microservice-sdk";
import { assert } from "chai";
import { initTest } from "../../../common/init-test";

describe("DELETE /api/v1/metrics/:metricId", () => {
	const { server, context } = initTest();
	const code = `code-${Date.now()}`;
	const relatedToRn = `relatedToRn-${Date.now()}`;
	const userId = parseInt(Date.now().toString().slice(5));
	const orgId = parseInt(Date.now().toString().slice(0, 3));
	const factor = parseInt(Date.now().toString().slice(0, 2));
	const version = orgId - factor;
	const accountId = orgId - factor - factor;
	const metricTypeVersion = parseInt(Date.now().toString().slice(0, 1));
	const deviceId = version - accountId;
	const batchId = `batchId-${Date.now()}`;
	const value = factor - metricTypeVersion;
	const takenAtOffset = metricTypeVersion + factor;

	before(async () => {
		process.env.TRANSLATE_API_URL = "";
		await container.resolve<App>("App").ready;
	});

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
				region: RegionEnum.US,
				accountId: accountId,
				userId: userId,
				relatedToRn: relatedToRn,
				metricCategoryId: context.createdMetricCategoryId,
				metricTypeId: context.createdMetricTypeId,
				metricTypeVersion: metricTypeVersion,
				deviceId: deviceId,
				batchId: batchId,
				value: value,
				takenAt: "2024-05-16T14:30:00+00:00",
				takenAtOffset: takenAtOffset,
			},
		]);
		assert.equal(statusCode, 201);

		context.createdMetricId = body[0].id;
	});

	it("Should delete metric", async () => {
		const { statusCode, body } = await server.delete(`/v1/metrics/${context.createdMetricId}`);
		assert.equal(statusCode, 204);
	});

	it("Should return error because metric  was deleted", async () => {
		const { statusCode, body } = await server.get(`/v1/metrics/${context.createdMetricId}`).send({});
		assert.equal(statusCode, 404);
		assert.isString(body.message);
	});

	it("Should return validation error if id is wrong", async () => {
		const { statusCode, body } = await server.delete("/v1/metrics/9999");
		assert.equal(statusCode, 404);
		assert.isString(body.message);
	});
});

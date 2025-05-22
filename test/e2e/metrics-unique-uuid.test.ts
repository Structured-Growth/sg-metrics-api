import "../../src/app/providers";
import { RegionEnum } from "@structured-growth/microservice-sdk";
import { assert } from "chai";
import { initTest } from "../common/init-test";
import { v4 } from "uuid";

describe("e2e/metrics-unique-uuid", () => {
	const { server, context } = initTest();
	const metricUuid = v4();
	const code = `code-${Date.now()}`;
	const relatedToRn = `relatedToRn-${Date.now()}`;
	const userId = parseInt(Date.now().toString().slice(4));
	const orgId = parseInt(Date.now().toString().slice(0, 3));
	const factor = parseInt(Date.now().toString().slice(0, 2));
	const version = orgId - factor;
	const accountId = orgId - factor - factor;
	const metricTypeVersion = parseInt(Date.now().toString().slice(0, 1));
	const deviceId = version - accountId;
	const batchId = `batchId-${Date.now()}`;
	const value = factor - metricTypeVersion;

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
	}).timeout(1800000);

	it("Should create metric with uuid", async () => {
		const { statusCode, body } = await server.post("/v1/metrics").send([
			{
				id: metricUuid,
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
				takenAt: "2024-05-16T14:30:00+01:00",
			},
		]);
		assert.equal(statusCode, 201);
	});

	it("Should return error if uuid exists", async () => {
		const { statusCode, body } = await server.post("/v1/metrics").send([
			{
				id: metricUuid,
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
				takenAt: "2024-05-16T14:30:00+01:00",
			},
		]);
		assert.equal(statusCode, 422);
	});
});

import "../../../../src/app/providers";
import { App } from "../../../../src/app/app";
import { container, webServer } from "@structured-growth/microservice-sdk";
import { RegionEnum } from "@structured-growth/microservice-sdk";
import { assert } from "chai";
import { initTest } from "../../../common/init-test";
import { v4 } from "uuid";

describe("POST /api/v1/metrics/bulk", () => {
	const { server, context } = initTest();
	const code = `code-${Date.now()}`;
	const metricUuid = v4();
	const metricUuid2 = v4();
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

	before(async () => container.resolve<App>("App").ready);

	it("Should run operations in a transaction", async () => {
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

	it("Should run bulk operation", async () => {
		const { statusCode, body } = await server.post("/v1/metrics/bulk").send([
			{
				op: "create",
				data: {
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
					metadata: {
						notes: "",
					},
				},
			},
			{
				op: "update",
				data: {
					id: metricUuid,
					value: value + 1,
				},
			},
			{
				op: "delete",
				data: {
					id: metricUuid,
				},
			},
			{
				op: "upsert",
				data: {
					id: metricUuid2,
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
			},
			{
				op: "upsert",
				data: {
					id: metricUuid2,
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
					value: value + 1,
					takenAt: "2024-05-16T14:30:00+01:00",
				},
			},
		]);
		assert.equal(statusCode, 200);
	});
});

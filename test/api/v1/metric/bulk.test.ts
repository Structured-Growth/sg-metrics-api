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

	before(async () => {
		process.env.TRANSLATE_API_URL = "";
		await container.resolve<App>("App").ready;
	});

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
	}).timeout(300000);

	it("Should handle two concurrent bulk requests each with upsert(update) on the same metric id", async () => {
		const metricUuid4 = v4();

		const base = await server.post("/v1/metrics/bulk").send([
			{
				op: "create",
				data: {
					id: metricUuid4,
					orgId: orgId,
					region: RegionEnum.US,
					accountId: accountId,
					userId: userId,
					relatedToRn: `base-${relatedToRn}`,
					metricCategoryId: context.createdMetricCategoryId,
					metricTypeId: context.createdMetricTypeId,
					metricTypeVersion: metricTypeVersion,
					deviceId: deviceId,
					batchId: `${batchId}-bulk-concurrent-init`,
					value: value,
					takenAt: "2024-05-16T14:30:00+01:00",
					metadata: { base: true },
				},
			},
		]);
		assert.equal(base.statusCode, 200);

		const bulk1 = [
			{
				op: "upsert",
				data: {
					id: metricUuid4,
					orgId: orgId,
					region: RegionEnum.US,
					accountId: accountId,
					userId: userId,
					relatedToRn: `${relatedToRn}-bulk1`,
					metricCategoryId: context.createdMetricCategoryId,
					metricTypeId: context.createdMetricTypeId,
					metricTypeVersion: metricTypeVersion,
					deviceId: deviceId,
					batchId: `${batchId}-bulk1`,
					value: value + 10,
					takenAt: "2024-05-16T14:30:00+01:00",
				},
			},
		];

		const newMeta = { concurrent: "bulk2", stamp: Date.now() };
		const bulk2 = [
			{
				op: "upsert",
				data: {
					id: metricUuid4,
					orgId: orgId,
					region: RegionEnum.US,
					accountId: accountId,
					userId: userId,
					relatedToRn: `${relatedToRn}-bulk2`,
					metricCategoryId: context.createdMetricCategoryId,
					metricTypeId: context.createdMetricTypeId,
					metricTypeVersion: metricTypeVersion,
					deviceId: deviceId,
					batchId: `${batchId}-bulk2`,
					value: value + 20,
					takenAt: "2024-05-16T14:30:00+01:00",
					metadata: newMeta,
				},
			},
		];

		const [r1, r2] = await Promise.all([
			server.post("/v1/metrics/bulk").send(bulk1),
			server.post("/v1/metrics/bulk").send(bulk2),
		]);

		assert.equal(r1.statusCode, 200);
		assert.equal(r2.statusCode, 200);

		const final = await server.post("/v1/metrics/upsert").send([
			{
				id: metricUuid4,
				orgId: orgId,
				region: RegionEnum.US,
				accountId: accountId,
				userId: userId,
				relatedToRn: `${relatedToRn}-bulk-final`,
				metricCategoryId: context.createdMetricCategoryId,
				metricTypeId: context.createdMetricTypeId,
				metricTypeVersion: metricTypeVersion,
				deviceId: deviceId,
				batchId: `${batchId}-bulk-final`,
				value: value + 30,
				takenAt: "2024-05-16T14:30:00+01:00",
			},
		]);
		assert.equal(final.statusCode, 200);
		assert.isArray(final.body);
		const finalMetric = final.body[0];
		assert.equal(finalMetric.id, metricUuid4);
		assert.deepEqual(finalMetric.metadata, newMeta, "metadata must persist from bulk2 upsert");
		assert.isUndefined((finalMetric as any)._hasMetadata);
	}).timeout(300000);

	it("Should run bulk operation 2", async () => {
		const metricUuid3 = v4();

		await Promise.all([
			server.post("/v1/metrics/bulk").send([
				{
					op: "upsert",
					data: {
						id: metricUuid3,
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
			]).then(({ statusCode, body }) => {
				console.log(statusCode, body);
				assert.equal(statusCode, 200);
			}),
			server.post("/v1/metrics/bulk").send([
				{
					op: "upsert",
					data: {
						id: metricUuid3,
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
			]).then(({ statusCode, body }) => {
				console.log(statusCode, body);
				assert.equal(statusCode, 200);
			})
		]);
	})
});

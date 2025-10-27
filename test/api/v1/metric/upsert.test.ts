import "../../../../src/app/providers";
import { App } from "../../../../src/app/app";
import { container, webServer } from "@structured-growth/microservice-sdk";
import { RegionEnum } from "@structured-growth/microservice-sdk";
import { assert } from "chai";
import { initTest } from "../../../common/init-test";

describe("POST /api/v1/metrics/upsert", () => {
	const { server, context } = initTest();
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
		const { statusCode, body } = await server.post("/v1/metrics/upsert").send([
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
				takenAt: "2024-05-16T14:30:00+01:00",
			},
		]);
		assert.equal(statusCode, 200);
		assert.equal(body[0].orgId, orgId);
		assert.equal(body[0].region, "us");
		assert.equal(body[0].accountId, accountId);
		assert.equal(body[0].userId, userId);
		assert.equal(body[0].relatedToRn, relatedToRn);
		assert.equal(body[0].metricCategoryId, context["createdMetricCategoryId"]);
		assert.equal(body[0].metricTypeId, context["createdMetricTypeId"]);
		assert.equal(body[0].metricTypeVersion, metricTypeVersion);
		assert.equal(body[0].deviceId, deviceId);
		assert.equal(body[0].batchId, batchId);
		assert.equal(body[0].value, value);
		assert.isString(body[0].takenAt);
		assert.equal(body[0].takenAtOffset, 60);
		assert.isString(body[0].arn);
		context.createdMetricId = body[0].id;
	});

	it("Should create metric by metric type code", async () => {
		const { statusCode, body } = await server.post("/v1/metrics/upsert").send([
			{
				orgId: orgId,
				region: RegionEnum.US,
				accountId: accountId,
				userId: userId,
				relatedToRn: relatedToRn,
				metricTypeCode: code,
				metricTypeVersion: metricTypeVersion,
				deviceId: deviceId,
				batchId: batchId,
				value: value,
				takenAt: "2024-05-16T14:30:00+01:00",
			},
		]);
		assert.equal(statusCode, 200);
		assert.equal(body[0].orgId, orgId);
		assert.equal(body[0].region, "us");
		assert.equal(body[0].accountId, accountId);
		assert.equal(body[0].userId, userId);
		assert.equal(body[0].relatedToRn, relatedToRn);
		assert.equal(body[0].metricCategoryId, context["createdMetricCategoryId"]);
		assert.equal(body[0].metricTypeId, context["createdMetricTypeId"]);
		assert.equal(body[0].metricCategoryCode, code);
		assert.equal(body[0].metricTypeCode, code);
		assert.equal(body[0].metricTypeVersion, metricTypeVersion);
		assert.equal(body[0].deviceId, deviceId);
		assert.equal(body[0].batchId, batchId);
		assert.equal(body[0].value, value);
		assert.isString(body[0].takenAt);
		assert.equal(body[0].takenAtOffset, 60);
		assert.isString(body[0].arn);
		context.createdMetricId = body[0].id;
	});

	it("Should return validation error", async () => {
		const { statusCode, body } = await server.post("/v1/metrics/upsert").send([
			{
				orgId: "main",
				accountId: -1,
				userId: -2,
				metricCategoryId: -3,
				metricTypeId: -4,
				metricTypeVersion: -5,
				deviceId: "abc",
				batchId: -1,
				value: "bad",
				takenAt: "now",
				takenAtOffset: "kk",
			},
		]);
		assert.equal(statusCode, 422);
		assert.isDefined(body.validation);
		assert.isString(body.message);
		assert.isString(body.validation.body[0].orgId[0]);
		assert.isString(body.validation.body[0].accountId[0]);
		assert.isString(body.validation.body[0].userId[0]);
		assert.isString(body.validation.body[0].metricCategoryId[0]);
		assert.isString(body.validation.body[0].metricTypeId[0]);
		assert.isString(body.validation.body[0].metricTypeVersion[0]);
		assert.isString(body.validation.body[0].deviceId[0]);
		assert.isString(body.validation.body[0].batchId[0]);
		assert.isString(body.validation.body[0].value[0]);
		assert.isString(body.validation.body[0].takenAt[0]);
		assert.isString(body.validation.body[0].takenAtOffset[0]);
	});

	it("Should create metric with metadata", async () => {
		const { statusCode, body } = await server.post("/v1/metrics/upsert").send([
			{
				orgId: orgId,
				region: RegionEnum.US,
				accountId: accountId,
				userId: userId,
				relatedToRn: relatedToRn,
				metricTypeCode: code,
				metricTypeVersion: metricTypeVersion,
				deviceId: deviceId,
				batchId: batchId,
				value: value,
				takenAt: "2024-05-16T14:30:00+01:00",
				metadata: {
					bool: true,
					string: "string",
					date: new Date().toISOString(),
					number: 1,
				},
			},
		]);
		assert.equal(statusCode, 200);
		assert.equal(body[0].metadata.bool, true);
		assert.equal(body[0].metadata.string, "string");
		assert.isString(body[0].metadata.date);
		assert.equal(body[0].metadata.number, 1);
	});

	it("Should update metric without changing metadata when metadata is omitted", async () => {
		const createResp = await server.post("/v1/metrics/upsert").send([
			{
				orgId: orgId,
				region: RegionEnum.US,
				accountId: accountId,
				userId: userId,
				relatedToRn: relatedToRn,
				metricTypeCode: code,
				metricTypeVersion: metricTypeVersion,
				deviceId: deviceId,
				batchId: `${batchId}-upd-omitted`,
				value: value,
				takenAt: "2024-05-16T14:30:00+01:00",
				metadata: {
					a: true,
					b: "text",
					c: 123,
				},
			},
		]);
		assert.equal(createResp.statusCode, 200);
		const created = createResp.body[0];
		assert.isDefined(created.id);
		const metricId = created.id;
		const originalMetadata = created.metadata;

		const updateResp = await server.post("/v1/metrics/upsert").send([
			{
				id: metricId,
				orgId: orgId,
				region: RegionEnum.US,
				accountId: accountId,
				userId: userId,
				relatedToRn: relatedToRn,
				metricTypeId: context.createdMetricTypeId,
				metricCategoryId: context.createdMetricCategoryId,
				metricTypeVersion: metricTypeVersion,
				deviceId: deviceId,
				batchId: `${batchId}-upd-omitted`,
				value: value + 1,
				takenAt: "2024-05-16T14:30:00+01:00",
			},
		]);
		assert.equal(updateResp.statusCode, 200);
		const updated = updateResp.body[0];

		assert.deepEqual(updated.metadata, originalMetadata);
		assert.isUndefined((updated as any)._hasMetadata);
	});

	it("Should update metric metadata when metadata is provided", async () => {
		const createResp = await server.post("/v1/metrics/upsert").send([
			{
				orgId: orgId,
				region: RegionEnum.US,
				accountId: accountId,
				userId: userId,
				relatedToRn: relatedToRn,
				metricTypeCode: code,
				metricTypeVersion: metricTypeVersion,
				deviceId: deviceId,
				batchId: `${batchId}-upd-provided`,
				value: value,
				takenAt: "2024-05-16T14:30:00+01:00",
				metadata: {
					m: "old",
					n: 1,
				},
			},
		]);
		assert.equal(createResp.statusCode, 200);
		const created = createResp.body[0];
		const metricId = created.id;

		const newMetadata = { m: "new", added: true };
		const updateResp = await server.post("/v1/metrics/upsert").send([
			{
				id: metricId,
				orgId: orgId,
				region: RegionEnum.US,
				accountId: accountId,
				userId: userId,
				relatedToRn: relatedToRn,
				metricTypeId: context.createdMetricTypeId,
				metricCategoryId: context.createdMetricCategoryId,
				metricTypeVersion: metricTypeVersion,
				deviceId: deviceId,
				batchId: `${batchId}-upd-provided`,
				value: value + 2,
				takenAt: "2024-05-16T14:30:00+01:00",
				metadata: newMetadata,
			},
		]);
		assert.equal(updateResp.statusCode, 200);
		const updated = updateResp.body[0];

		assert.deepEqual(updated.metadata, newMetadata);
		assert.isUndefined((updated as any)._hasMetadata);
	});

	it("Should handle concurrent upserts on the same metric id without errors", async () => {
		const baseCreate = await server.post("/v1/metrics/upsert").send([
			{
				orgId: orgId,
				region: RegionEnum.US,
				accountId: accountId,
				userId: userId,
				relatedToRn: relatedToRn,
				metricTypeCode: code,
				metricTypeVersion: metricTypeVersion,
				deviceId: deviceId,
				batchId: `${batchId}-concurrent-base`,
				value: value,
				takenAt: "2024-05-16T14:30:00+01:00",
				metadata: { base: 1 },
			},
		]);
		assert.equal(baseCreate.statusCode, 200);
		const created = baseCreate.body[0];
		const metricId = created.id;
		assert.isDefined(metricId);

		const upd1 = [
			{
				id: metricId,
				orgId: orgId,
				region: RegionEnum.US,
				accountId: accountId,
				userId: userId,
				relatedToRn: relatedToRn,
				metricTypeId: context.createdMetricTypeId,
				metricCategoryId: context.createdMetricCategoryId,
				metricTypeVersion: metricTypeVersion,
				deviceId: deviceId,
				batchId: `${batchId}-concurrent-1`,
				value: value + 10,
				takenAt: "2024-05-16T14:30:00+01:00",
			},
		];

		const newMetadata = { concurrent: "win", t: Date.now() };
		const upd2 = [
			{
				id: metricId,
				orgId: orgId,
				region: RegionEnum.US,
				accountId: accountId,
				userId: userId,
				relatedToRn: relatedToRn,
				metricTypeId: context.createdMetricTypeId,
				metricCategoryId: context.createdMetricCategoryId,
				metricTypeVersion: metricTypeVersion,
				deviceId: deviceId,
				batchId: `${batchId}-concurrent-2`,
				value: value + 20,
				takenAt: "2024-05-16T14:30:00+01:00",
				metadata: newMetadata,
			},
		];

		const [r1, r2] = await Promise.all([
			server.post("/v1/metrics/upsert").send(upd1),
			server.post("/v1/metrics/upsert").send(upd2),
		]);

		assert.equal(r1.statusCode, 200);
		assert.equal(r2.statusCode, 200);
		assert.isArray(r1.body);
		assert.isArray(r2.body);

		const b1 = r1.body[0];
		const b2 = r2.body[0];

		assert.equal(b1.id, metricId);
		assert.equal(b2.id, metricId);

		assert.isUndefined((b1 as any)._hasMetadata);
		assert.isUndefined((b2 as any)._hasMetadata);

		const oneHasNew =
			(b1.metadata && b1.metadata.concurrent === "win") || (b2.metadata && b2.metadata.concurrent === "win");
		assert.isTrue(oneHasNew, "One of concurrent updates must set new metadata");

		const finalMetadata = { final: true };
		const finalResp = await server.post("/v1/metrics/upsert").send([
			{
				id: metricId,
				orgId: orgId,
				region: RegionEnum.US,
				accountId: accountId,
				userId: userId,
				relatedToRn: relatedToRn,
				metricTypeId: context.createdMetricTypeId,
				metricCategoryId: context.createdMetricCategoryId,
				metricTypeVersion: metricTypeVersion,
				deviceId: deviceId,
				batchId: `${batchId}-concurrent-final`,
				value: value + 30,
				takenAt: "2024-05-16T14:30:00+01:00",
				metadata: finalMetadata,
			},
		]);
		assert.equal(finalResp.statusCode, 200);
		assert.deepEqual(finalResp.body[0].metadata, finalMetadata);
	});

	it("Should return error if there are to much fields", async () => {
		const { statusCode, body } = await server.post("/v1/metrics/upsert").send([
			{
				orgId: orgId,
				region: RegionEnum.US,
				accountId: accountId,
				userId: userId,
				relatedToRn: relatedToRn,
				metricTypeCode: code,
				metricTypeVersion: metricTypeVersion,
				deviceId: deviceId,
				batchId: batchId,
				value: value,
				takenAt: "2024-05-16T14:30:00+01:00",
				metadata: {
					bool: true,
					string: "string",
					date: new Date().toISOString(),
					number: 1,
					bool1: true,
					string1: "string",
					date1: new Date().toISOString(),
					number1: 1,
					bool2: true,
					string2: "string",
					date2: new Date().toISOString(),
					number2: 1,
				},
			},
		]);
		assert.equal(statusCode, 422);
		assert.isDefined(body.validation);
		assert.isString(body.message);
	});
});

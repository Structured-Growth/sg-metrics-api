import "../../../../src/app/providers";
import { App } from "../../../../src/app/app";
import { container, webServer } from "@structured-growth/microservice-sdk";
import { RegionEnum } from "@structured-growth/microservice-sdk";
import { assert } from "chai";
import { initTest } from "../../../common/init-test";

describe("GET /api/v1/metrics", () => {
	const { server, context } = initTest();
	const code = `code-${Date.now()}`;
	const userId = parseInt(Date.now().toString().slice(3));
	const relatedToRn = `relatedTo-${Date.now()}`;
	const orgId = parseInt(Date.now().toString().slice(0, 3));
	const factor = parseInt(Date.now().toString().slice(0, 2));
	const version = orgId - factor;
	const accountId = orgId - factor - factor;
	const metricTypeVersion = parseInt(Date.now().toString().slice(0, 1));
	const deviceId = parseInt(Date.now().toString().slice(0, 4));
	const batchId = `batchId-${Date.now()}`;
	const value = parseInt(Date.now().toString().slice(0, 5));
	const valueMin = value - factor;
	const valueMax = value + factor;

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
	});

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
				takenAt: "2024-05-16T14:30:00+01:00",
			},
		]);
		assert.equal(statusCode, 201);
		assert.equal(body[0].relatedToRn, relatedToRn);
		context.createdMetricId = body[0].id;
	});

	it("Should create second metric", async () => {
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
				takenAt: "2024-05-16T11:30:00+01:00",
			},
		]);
		assert.equal(statusCode, 201);
		assert.equal(body[0].relatedToRn, relatedToRn);
		context.createdMetric2Id = body[0].id;
	});

	it("Should return metric", async () => {
		const { statusCode, body } = await server.get(`/v1/metrics/${context.createdMetricId}`).send({});
		assert.equal(statusCode, 200);
		assert.equal(body.id, context["createdMetricId"]);
	}).timeout(1800000);

	it("Should return validation error", async () => {
		const { statusCode, body } = await server.get("/v1/metrics").query({
			orgId: "superOrg",
			accountId: "MyAccount",
			userId: "SuperUser",
			metricTypeId: "body",
			metricTypeVersion: -1,
			deviceId: "mydevice",
			batchId: null,
			value: "bad",
			takenAt: "today",
			takenAtOffset: "notneeded",
		});
		assert.equal(statusCode, 422);
		assert.equal(body.name, "ValidationError");
		assert.isString(body.validation.query.orgId[0]);
		assert.isString(body.validation.query.accountId[0]);
		assert.isString(body.validation.query.userId[0]);
		assert.isString(body.validation.query.metricTypeId[0]);
		assert.isString(body.validation.query.metricTypeVersion[0]);
		assert.isString(body.validation.query.deviceId[0]);
		assert.isString(body.validation.query.batchId[0]);
		assert.isString(body.validation.query.value[0]);
		assert.isString(body.validation.query.takenAt[0]);
		assert.isString(body.validation.query.takenAtOffset[0]);
	});

	it("Should return created metric by id", async () => {
		const { statusCode, body } = await server.get("/v1/metrics").query({
			userId,
			"id[0]": context["createdMetricId"],
		});
		assert.equal(statusCode, 200);
		assert.equal(body.data[0].id, context["createdMetricId"]);
		assert.equal(body.data[0].orgId, orgId);
		assert.equal(body.data[0].region, "us");
		assert.equal(body.data[0].accountId, accountId);
		assert.equal(body.data[0].userId, userId);
		assert.equal(body.data[0].relatedToRn, relatedToRn);
		assert.equal(body.data[0].metricCategoryId, context["createdMetricCategoryId"]);
		assert.equal(body.data[0].metricTypeId, context["createdMetricTypeId"]);
		assert.equal(body.data[0].metricTypeVersion, metricTypeVersion);
		assert.equal(body.data[0].deviceId, deviceId);
		assert.equal(body.data[0].batchId, batchId);
		assert.equal(body.data[0].value, value);
		assert.equal(body.data[0].takenAt, "2024-05-16T13:30:00.000Z");
		assert.equal(body.data[0].takenAtOffset, 60);
		assert.isString(body.data[0].recordedAt);
		assert.equal(body.limit, 20);
	}).timeout(1800000);

	it("Should return created metrics by ids", async () => {
		const { statusCode, body } = await server.get("/v1/metrics").query({
			userId,
			"id[0]": context["createdMetricId"],
			"id[1]": context["createdMetric2Id"],
		});
		assert.equal(statusCode, 200);
		assert.equal(body.data[0].id, context["createdMetricId"]);
		assert.equal(body.data[1].id, context["createdMetric2Id"]);
		assert.equal(body.limit, 20);
	}).timeout(1800000);

	it("Should search by value and sort by time", async () => {
		const sortField = "value";
		const sortOrder = "DESC";

		const { statusCode, body } = await server.get("/v1/metrics").query({
			userId,
			value: value,
			"sort[1]": "takenAt:asc",
		});
		assert.equal(statusCode, 200);
		assert.equal(body.data[0].value, value);
		assert.equal(body.data[0].userId, userId);
	}).timeout(1800000);

	it("Should search by deviceId", async () => {
		const { statusCode, body } = await server.get("/v1/metrics").query({
			userId,
			deviceId: deviceId,
		});
		assert.equal(statusCode, 200);
		assert.equal(body.data[0].deviceId, deviceId);
		assert.equal(body.data[0].userId, userId);
	}).timeout(1800000);

	it("Should search by value range", async () => {
		const { statusCode, body } = await server.get("/v1/metrics").query({
			userId,
			valueMin: valueMin,
			valueMax: valueMax,
		});
		assert.equal(statusCode, 200);
		assert.equal(body.data[0].value, value);
		assert.equal(body.data[0].userId, userId);
	}).timeout(1800000);

	it("Should search by taken time range", async () => {
		const { statusCode, body } = await server.get("/v1/metrics").query({
			userId,
			takenAtMin: "2024-04-28 12:29:34",
			takenAtMax: "2024-05-28 12:29:34",
		});
		assert.equal(statusCode, 200);
		assert.isString(body.data[0].takenAt);
		assert.equal(body.data[0].userId, userId);
	}).timeout(1800000);

	it("Should search by recorder time range", async () => {
		const dateMin = new Date();
		const dateMax = new Date();
		dateMin.setMinutes(dateMin.getMinutes() - 60);
		dateMax.setMinutes(dateMax.getMinutes() + 60);

		const { statusCode, body } = await server.get("/v1/metrics").query({
			userId,
			recordedAtMin: dateMin.toISOString(),
			recordedAtMax: dateMax.toISOString(),
		});
		assert.equal(statusCode, 200);
		assert.isString(body.data[0].recordedAt);
		assert.equal(body.data[0].userId, userId);
	}).timeout(1800000);

	it("Should return nextToken when results exceed limit", async () => {
		for (let i = 0; i < 15; i++) {
			const metricValue = value + i;
			const takenAtTime = new Date();
			takenAtTime.setMinutes(takenAtTime.getMinutes() + i);

			const takenAtFormatted = takenAtTime.toISOString().replace(/\.\d{3}Z$/, "+00:00");

			const { statusCode } = await server.post("/v1/metrics").send([
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
					value: metricValue,
					takenAt: takenAtFormatted,
				},
			]);
			assert.equal(statusCode, 201);
		}

		let { statusCode, body } = await server.get("/v1/metrics").query({
			userId,
			limit: 5,
		});
		assert.equal(statusCode, 200);
		assert.equal(body.data.length, 5);
		assert.isString(body.nextToken);

		const firstNextToken = body.nextToken;

		({ statusCode, body } = await server.get("/v1/metrics").query({
			userId,
			limit: 5,
			nextToken: firstNextToken,
		}));
		assert.equal(statusCode, 200);
		assert.equal(body.data.length, 5);
		assert.isString(body.nextToken);

		const secondNextToken = body.nextToken;

		({ statusCode, body } = await server.get("/v1/metrics").query({
			userId,
			limit: 5,
			nextToken: secondNextToken,
		}));
		assert.equal(statusCode, 200);
		assert.equal(body.data.length, 5);
		assert.isString(body.nextToken);
	}).timeout(1800000);

	it("Should search by relatedToRn", async () => {
		const { statusCode, body } = await server.get("/v1/metrics").query({
			userId,
			relatedToRn: relatedToRn,
		});
		assert.equal(statusCode, 200);
		assert.equal(body.data[0].userId, userId);
		assert.equal(body.data[0].relatedToRn, relatedToRn);
	}).timeout(1800000);

	it("Should return error if metricTypeId is not an array", async () => {
		const { statusCode, body } = await server.get("/v1/metrics").query({
			userId,
			metricTypeId: context.createdMetricTypeId,
		});
		assert.equal(statusCode, 422);
		assert.isString(body.validation.query.metricTypeId[0]);
	});

	it("Should search by multiple metric types", async () => {
		const { statusCode, body } = await server.get("/v1/metrics").query({
			userId,
			"metricTypeId[0]": context.createdMetricTypeId,
		});
		assert.equal(statusCode, 200);
		assert.equal(body.data[0].userId, userId);
		assert.equal(body.data[0].metricTypeId, context.createdMetricTypeId);
	});
});

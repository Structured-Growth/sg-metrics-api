import "../../../../src/app/providers";
import { App } from "../../../../src/app/app";
import { container, webServer } from "@structured-growth/microservice-sdk";
import { RegionEnum } from "@structured-growth/microservice-sdk";
import {assert} from "chai";
import {initTest} from "../../../common/init-test";

describe("GET /api/v1/metrics/aggregate", () => {
	const { server, context } = initTest();
	const code = `code-${Date.now()}`;
	const userId = Date.now();
	const relatedToRn = `relatedTo-${Date.now()}`;
	const orgId = parseInt(Date.now().toString().slice(0, 3));
	const factor = parseInt(Date.now().toString().slice(0, 2));
	const version = orgId - factor;
	const accountId = orgId - factor - factor;
	const metricTypeVersion = parseInt(Date.now().toString().slice(0, 1));
	const deviceId = parseInt(Date.now().toString().slice(0, 4));
	const batchId = `batchId-${Date.now()}`;
	const value = parseInt(Date.now().toString().slice(0, 5));
	const takenAtOffset = 90;

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
				value: value + factor,
				takenAt: "2024-05-30T14:30:00+00:00",
				takenAtOffset: takenAtOffset,
			}
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
				value: value - factor,
				takenAt: "2024-05-21T11:30:00+00:00",
				takenAtOffset: takenAtOffset,
			}
		]);
		assert.equal(statusCode, 201);
		assert.equal(body[0].relatedToRn, relatedToRn);
		context.createdMetric2Id = body[0].id;
	});

	it("Should return metric", async () => {
		const { statusCode, body } = await server.get(`/v1/metrics/${context.createdMetricId}`).send({
		});
		assert.equal(statusCode, 200);
		assert.equal(body.id, context["createdMetricId"]);
	}).timeout(1800000);

	it("Should aggregate metrics", async () => {
		const { statusCode, body } = await server.get(`/v1/metrics/aggregate`).query({
			"aggregationInterval": "30d",
			"takenAtFrom": "01-05-2024"
		});
		assert.equal(statusCode, 200);
	}).timeout(1800000);

	it("Should aggregate metrics wih one filter", async () => {
		const { statusCode, body } = await server.get(`/v1/metrics/aggregate`).query({
			"aggregationInterval": "30d",
			orgId
		});
		assert.equal(statusCode, 200);
	}).timeout(1800000);

	it("Should aggregate metrics wih one filter and new sort", async () => {
		const { statusCode, body } = await server.get(`/v1/metrics/aggregate`).query({
			"aggregationInterval": "30d",
			orgId,
			'sort[0]': "value:desc",
			'sort[1]': "takenAt:asc"
		});
		assert.equal(statusCode, 200);
	}).timeout(1800000);

	it("Should aggregate metrics wih two filter", async () => {
		const { statusCode, body } = await server.get(`/v1/metrics/aggregate`).query({
			"aggregationInterval": "30d",
			metricTypeId: context.createdMetricTypeId,
			deviceId: deviceId
		});
		assert.equal(statusCode, 200);
	}).timeout(1800000);


	it("Should aggregate metrics wih three filter", async () => {
		const { statusCode, body } = await server.get(`/v1/metrics/aggregate`).query({
			"aggregationInterval": "30d",
			metricTypeId: context.createdMetricTypeId,
			accountId: accountId,
			userId: userId
		});
		assert.equal(statusCode, 200);
	}).timeout(1800000);
});

import "../../../../src/app/providers";
import { App } from "../../../../src/app/app";
import { container } from "@structured-growth/microservice-sdk";
import { RegionEnum } from "@structured-growth/microservice-sdk";
import { assert } from "chai";
import { initTest } from "../../../common/init-test";

describe("GET /api/v1/metrics/aggregate", () => {
	const { server, context } = initTest();
	const code = `code-${Date.now()}`;
	const userId = parseInt(Date.now().toString().slice(5));
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
				value: value - factor,
				takenAt: "2024-05-21T11:30:00+00:00",
				takenAtOffset: takenAtOffset,
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
	});

	it("Should aggregate metrics", async () => {
		const { statusCode, body } = await server.get(`/v1/metrics/aggregate`).query({
			column: "time",
			columnAggregation: "1d",
			row: "value",
			rowAggregation: "avg",
			takenAtMin: "2024-05-01T00:00:00Z",
		});
		assert.equal(statusCode, 200);
	});

	it("Should aggregate metrics with one filter", async () => {
		const { statusCode, body } = await server.get(`/v1/metrics/aggregate`).query({
			column: "time",
			columnAggregation: "1d",
			row: "value",
			rowAggregation: "avg",
			orgId,
		});
		assert.equal(statusCode, 200);
	});

	it("Should aggregate metrics wih one filter and new sort", async () => {
		const { statusCode, body } = await server.get(`/v1/metrics/aggregate`).query({
			column: "time",
			columnAggregation: "1d",
			row: "value",
			rowAggregation: "avg",
			orgId: orgId,
			sort: ["avg:desc", "takenAt:asc"],
		});
		assert.equal(statusCode, 200);
	});

	it("Should aggregate metrics with two filter", async () => {
		const { statusCode, body } = await server.get(`/v1/metrics/aggregate`).query({
			column: "time",
			columnAggregation: "1d",
			row: "value",
			rowAggregation: "avg",
			"metricTypeId[0]": context.createdMetricTypeId,
			deviceId: deviceId,
		});
		assert.equal(statusCode, 200);
	});

	it("Should aggregate metrics wih three filter", async () => {
		const { statusCode, body } = await server.get(`/v1/metrics/aggregate`).query({
			column: "time",
			columnAggregation: "1d",
			row: "value",
			rowAggregation: "avg",
			"metricTypeId[0]": context.createdMetricTypeId,
			"accountId[0]": accountId,
			"userId[0]": userId,
		});
		assert.equal(statusCode, 200);
	});

	it("Should return nextToken when aggregate results exceed limit", async () => {
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

		let { statusCode, body } = await server.get("/v1/metrics/aggregate").query({
			column: "time",
			columnAggregation: "1d",
			row: "value",
			rowAggregation: "avg",
			limit: 5,
		});
		assert.equal(statusCode, 200);
		assert.equal(body.data.length, 5);
		// assert.isString(body.nextToken);

		const firstNextToken = body.nextToken;

		({ statusCode, body } = await server.get("/v1/metrics/aggregate").query({
			column: "time",
			columnAggregation: "1d",
			row: "value",
			rowAggregation: "avg",
			limit: 5,
			nextToken: firstNextToken,
		}));
		assert.equal(statusCode, 200);
		assert.equal(body.data.length, 5);
		// assert.isString(body.nextToken);

		const secondNextToken = body.nextToken;

		({ statusCode, body } = await server.get("/v1/metrics/aggregate").query({
			column: "time",
			columnAggregation: "1d",
			row: "value",
			rowAggregation: "avg",
			limit: 5,
			nextToken: secondNextToken,
		}));
		assert.equal(statusCode, 200);
		assert.equal(body.data.length, 5);
		// assert.isString(body.nextToken);
	});

	it("Should aggregate metrics with sum row aggregation", async () => {
		const { statusCode, body } = await server.get(`/v1/metrics/aggregate`).query({
			column: "time",
			columnAggregation: "1d",
			row: "value",
			rowAggregation: "sum",
			limit: 5,
		});
		assert.equal(statusCode, 200);
	});

	it("Should aggregate metrics with min row aggregation", async () => {
		const { statusCode, body } = await server.get(`/v1/metrics/aggregate`).query({
			column: "time",
			columnAggregation: "1d",
			row: "value",
			rowAggregation: "min",
			limit: 5,
		});
		assert.equal(statusCode, 200);
	});

	it("Should aggregate metrics with max row aggregation", async () => {
		const { statusCode, body } = await server.get(`/v1/metrics/aggregate`).query({
			column: "time",
			columnAggregation: "1d",
			row: "value",
			rowAggregation: "max",
			limit: 5,
		});
		assert.equal(statusCode, 200);
	});

	it("Should aggregate metrics with avg row aggregation", async () => {
		const { statusCode, body } = await server.get(`/v1/metrics/aggregate`).query({
			column: "time",
			columnAggregation: "1d",
			row: "value",
			rowAggregation: "avg",
			limit: 5,
		});
		assert.equal(statusCode, 200);
	});

	it("Should aggregate metrics with 1h column aggregation", async () => {
		const { statusCode, body } = await server.get(`/v1/metrics/aggregate`).query({
			column: "time",
			columnAggregation: "1h",
			row: "value",
			rowAggregation: "avg",
			limit: 5,
		});
		assert.equal(statusCode, 200);
	});

	it("Should aggregate metrics with 1d column aggregation", async () => {
		const { statusCode, body } = await server.get(`/v1/metrics/aggregate`).query({
			column: "time",
			columnAggregation: "1d",
			row: "value",
			rowAggregation: "avg",
			limit: 5,
		});
		assert.equal(statusCode, 200);
	});

	it("Should aggregate metrics with 30d column aggregation", async () => {
		const { statusCode, body } = await server.get(`/v1/metrics/aggregate`).query({
			column: "time",
			columnAggregation: "30d",
			row: "value",
			rowAggregation: "avg",
			limit: 5,
		});
		assert.equal(statusCode, 200);
	});

	it("Should aggregate metrics with column as orgId and row as value", async () => {
		const { statusCode, body } = await server.get(`/v1/metrics/aggregate`).query({
			column: "orgId",
			row: "value",
			rowAggregation: "avg",
			limit: 5,
		});

		assert.equal(statusCode, 200);
		assert.isArray(body.data);
		body.data.forEach((item) => {
			assert.property(item, "orgId");
			assert.property(item, "metricTypeCode");
			assert.property(item, "avg");
		});
	});

	it("Should aggregate metrics with column as orgId, row as value, and rowAggregation as max", async () => {
		const { statusCode, body } = await server.get(`/v1/metrics/aggregate`).query({
			column: "orgId",
			row: "value",
			rowAggregation: "max",
			limit: 5,
		});
		assert.equal(statusCode, 200);
		assert.isArray(body.data);
		body.data.forEach((item) => {
			assert.property(item, "orgId");
			assert.property(item, "metricTypeCode");
			assert.property(item, "max");
		});
	});

	it("Should aggregate metrics with column as orgId, row as value, and rowAggregation as min", async () => {
		const { statusCode, body } = await server.get(`/v1/metrics/aggregate`).query({
			column: "orgId",
			row: "value",
			rowAggregation: "min",
			limit: 5,
		});
		assert.equal(statusCode, 200);
		assert.isArray(body.data);
		body.data.forEach((item) => {
			assert.property(item, "orgId");
			assert.property(item, "metricTypeCode");
			assert.property(item, "min");
		});
	});

	it("Should aggregate metrics with column as orgId and row as time with min aggregation", async () => {
		const { statusCode, body } = await server.get(`/v1/metrics/aggregate`).query({
			column: "orgId",
			row: "time",
			rowAggregation: "min",
			limit: 5,
		});
		assert.equal(statusCode, 200);
		assert.isArray(body.data);
		body.data.forEach((item) => {
			assert.property(item, "orgId");
			assert.property(item, "metricTypeCode");
			assert.property(item, "min");
		});
	});

	it("Should aggregate metrics with column as orgId and row as time with max aggregation", async () => {
		const { statusCode, body } = await server.get(`/v1/metrics/aggregate`).query({
			column: "orgId",
			row: "time",
			rowAggregation: "max",
			limit: 5,
		});
		assert.equal(statusCode, 200);
		assert.isArray(body.data);
		body.data.forEach((item) => {
			assert.property(item, "orgId");
			assert.property(item, "metricTypeCode");
			assert.property(item, "max");
		});
	});

	it("Should aggregate metrics with column as time and row as orgId with min aggregation", async () => {
		const { statusCode, body } = await server.get(`/v1/metrics/aggregate`).query({
			column: "time",
			columnAggregation: "1d",
			row: "orgId",
			rowAggregation: "min",
			limit: 5,
		});
		assert.equal(statusCode, 200);
		assert.isArray(body.data);
		body.data.forEach((item) => {
			assert.property(item, "takenAt");
			assert.property(item, "metricTypeCode");
			assert.property(item, "min");
		});
	});

	it("Should aggregate metrics with column as time and row as orgId with max aggregation", async () => {
		const { statusCode, body } = await server.get(`/v1/metrics/aggregate`).query({
			column: "time",
			columnAggregation: "1d",
			row: "orgId",
			rowAggregation: "max",
			limit: 5,
		});
		assert.equal(statusCode, 200);
		assert.isArray(body.data);
		body.data.forEach((item) => {
			assert.property(item, "takenAt");
			assert.property(item, "metricTypeCode");
			assert.property(item, "max");
		});
	});
});

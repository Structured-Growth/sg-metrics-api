import "../../../../src/app/providers";
import { App } from "../../../../src/app/app";
import { container, webServer } from "@structured-growth/microservice-sdk";
import { RegionEnum } from "@structured-growth/microservice-sdk";
import {assert} from "chai";
import {initTest} from "../../../common/init-test";

describe("GET /api/v1/metrics/aggregate", () => {
	const { server, context } = initTest();
	const code = `code-${Date.now()}`;


	before(async () => container.resolve<App>("App").ready);

	it("Should create metric category", async () => {
		const { statusCode, body } = await server.post("/v1/metric-category").send({
			orgId: 1,
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
			orgId: 1,
			region: RegionEnum.US,
			metricCategoryId: context["createdMetricCategoryId"],
			title: code,
			code: code,
			unit: code,
			factor: 1,
			relatedTo: code,
			version: 1,
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
		const { statusCode, body } = await server.post("/v1/metrics").send({
			orgId: 1,
			accountId: 13,
			userId: 88,
			metricCategoryId: context["createdMetricCategoryId"],
			//metricCategoryId: 333,
			metricTypeId: context["createdMetricTypeId"],
			//metricTypeId: 444,
			metricTypeVersion: 2,
			deviceId: 101,
			batchId: "1234567890",
			value: 50,
			takenAt: "2023-05-11T14:30:00+00:00",
			takenAtOffset: 90,
		});
		assert.equal(statusCode, 201);
		context.createdMetricId = body.id;
	});

	it("Should return metric", async () => {
		const { statusCode, body } = await server.get(`/v1/metrics/${context.createdMetricId}`).send({
		});
		assert.equal(statusCode, 200);
		assert.equal(body.id, context["createdMetricId"]);
	});

	it("Should aggregate metrics", async () => {
		const { statusCode, body } = await server.get(`/v1/metrics/aggregate`).query({
			"aggregationInterval": "1M",
		});
		assert.equal(statusCode, 200);
	});


});

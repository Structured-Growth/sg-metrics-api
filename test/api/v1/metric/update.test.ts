import "../../../../src/app/providers";
import { App } from "../../../../src/app/app";
import { container, webServer } from "@structured-growth/microservice-sdk";
import { RegionEnum } from "@structured-growth/microservice-sdk";
import {assert} from "chai";
import {initTest} from "../../../common/init-test";

describe("PUT /api/v1/metrics/:metricId", () => {
	const { server, context } = initTest();

	before(async () => container.resolve<App>("App").ready);

	it("Should create metric", async () => {
		const { statusCode, body } = await server.post("/v1/metrics").send([
			{
				orgId: 1,
				region: RegionEnum.US,
				accountId: 1,
				userId: 1,
				metricCategoryId: 1,
				metricTypeId: 1,
				metricTypeVersion: 1,
				deviceId: 1,
				batchId: "1",
				value: 3600,
				takenAt: "2024-05-16T14:30:00+00:00",
				takenAtOffset: 0,
		}
		]);
		assert.equal(statusCode, 201);
		context.createdMetricId = body[0].id;
	});

	it("Should return metric", async () => {
		const { statusCode, body } = await server.get(`/v1/metrics/${context.createdMetricId}`);
		assert.equal(statusCode, 200);
		console.log(body);
	});

	it("Should update metric", async () => {
		const { statusCode, body } = await server.put(`/v1/metrics/${context.createdMetricId}`).send({
			value: 3601
		});
		assert.equal(statusCode, 200);
		console.log(body);
	});

	it("Should return metric", async () => {
		const { statusCode, body } = await server.get(`/v1/metrics/${context.createdMetricId}`);
		assert.equal(statusCode, 200);
		console.log(body);
	});

	it("Should update metric", async () => {
		const { statusCode, body } = await server.put(`/v1/metrics/${context.createdMetricId}`).send({
			takenAt: new Date().toISOString(),
		});
		assert.equal(statusCode, 200);
		console.log(body);
	});

	it("Should return metric", async () => {
		const { statusCode, body } = await server.get(`/v1/metrics/${context.createdMetricId}`);
		assert.equal(statusCode, 200);
		console.log(body);
	});


});

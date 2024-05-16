import "../../../../src/app/providers";
import { assert } from "chai";
import { App } from "../../../../src/app/app";
import { container, webServer } from "@structured-growth/microservice-sdk";
import { agent } from "supertest";
import { routes } from "../../../../src/routes";
import { RegionEnum } from "@structured-growth/microservice-sdk";
import {initTest} from "../../../common/init-test";

describe("PUT /api/v1/metric-category/:metricCategoryId", () => {
	const { server, context } = initTest();
	const code = `code-${Date.now()}`;
	let metric;

	before(async () => container.resolve<App>("App").ready);

	it("Should create metric category", async () => {
		const { statusCode, body } = await server.post("/v1/metric-category").send({
			orgId: 2,
			region: RegionEnum.US,
			title: code,
			code: code,
			status: "inactive",
			metadata: {
				specUrl: "https://",
				countryCode: "test",
			},
		});
		assert.equal(statusCode, 201);
		assert.isNumber(body.id);
		assert.equal(body.status, "inactive");
		metric = body;
		context.createdMetricCategoryId = body.id;
	});


	it("Should return validation error", async () => {
		const { statusCode, body } = await server.put(`/v1/metric-category/${context.createdMetricCategoryId}`).send({
			title: code + "-updated",
			status: "super",
			metadata: {
				specUrl: "https://updated",
				countryCode: "test+updated",
			},
		});
		assert.equal(statusCode, 422);
		assert.isDefined(body.validation);
		assert.isString(body.message);
		assert.isString(body.validation.body.status[0]);
		metric = body;
	});

	it("Should update metric category", async () => {
		const { statusCode, body } = await server.put(`/v1/metric-category/${context.createdMetricCategoryId}`).send({
			title: code + "-updated",
			status: "active",
			metadata: {
				specUrl: "https://updated",
				countryCode: "test+updated",
			},
		});
		assert.equal(statusCode, 200);
		assert.equal(body.status, "active");
		assert.isString(body.title, code + "-updated");
		metric = body;
	});
});

import "../../../../src/app/providers";
import { App } from "../../../../src/app/app";
import { container, webServer } from "@structured-growth/microservice-sdk";
import { RegionEnum } from "@structured-growth/microservice-sdk";
import {initTest} from "../../../common/init-test";
import {assert} from "chai";

describe("PUT /api/v1/metric-type/:metricTypeId", () => {
	const { server, context } = initTest();
	const code = `code-${Date.now()}`;
	let metric;

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

	});

	it("Should create metric type", async () => {
		const { statusCode, body } = await server.post("/v1/metric-type").send({
			orgId: 1,
			region: RegionEnum.US,
			metricCategoryId: 1,
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
		assert.equal(body.status, "inactive");
		metric = body;
		context.createdMetricTypeId = body.id;
	});
	it("Should return validation error", async () => {
		const { statusCode, body } = await server.put(`/v1/metric-type/${context.createdMetricTypeId}`).send({
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

	it("Should update metric type", async () => {
		const { statusCode, body } = await server.put(`/v1/metric-type/${context.createdMetricTypeId}`).send({
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

import "../../../../src/app/providers";
import { App } from "../../../../src/app/app";
import { container, webServer } from "@structured-growth/microservice-sdk";
import { agent } from "supertest";
import { routes } from "../../../../src/routes";
import { RegionEnum } from "@structured-growth/microservice-sdk";
import {assert} from "chai";

describe("POST /api/v1/metric-type", () => {
	const server = agent(webServer(routes));
	const code = `code-${Date.now()}`;

	before(async () => container.resolve<App>("App").ready);

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
			status: "active",
			metadata: {
				specUrl: "https://",
				countryCode: "test",
			},
		});
		assert.equal(statusCode, 201);
		assert.isNumber(body.id);
		assert.isString(body.createdAt);
		assert.isString(body.updatedAt);
		assert.equal(body.orgId, 1);
		assert.equal(body.region, "us");
		assert.isString(body.title, code);
		assert.isString(body.unit, code);
		assert.equal(body.factor, 1);
		assert.isString(body.relatedTo, code);
		assert.equal(body.version, 1);
		assert.equal(body.status, "active");
		assert.isString(body.arn);
	});

	it("Should return validation error", async () => {
		const { statusCode, body } = await server.post("/v1/metric-type").send({
			orgId: "main",
			region: "Ukraine",
			title: -1,
			code: -1,
			unit: -1,
			factor: "a",
			relatedTo: -1,
			version: "b",
			status: "super",
			metadata: {
				specUrl: "https://",
				countryCode: "test",
			},
		});
		assert.equal(statusCode, 422);
		assert.isDefined(body.validation);
		assert.isString(body.message);
		assert.isString(body.validation.body.orgId[0]);
		assert.isString(body.validation.body.title[0]);
		assert.isString(body.validation.body.code[0]);
		assert.isString(body.validation.body.unit[0]);
		assert.isString(body.validation.body.factor[0]);
		assert.isString(body.validation.body.relatedTo[0]);
		assert.isString(body.validation.body.version[0]);
		assert.isString(body.validation.body.status[0]);


	});
});

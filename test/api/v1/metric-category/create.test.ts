import "../../../../src/app/providers";
import { App } from "../../../../src/app/app";
import { container, webServer } from "@structured-growth/microservice-sdk";
import { agent } from "supertest";
import { routes } from "../../../../src/routes";
import { RegionEnum } from "@structured-growth/microservice-sdk";
import { assert } from "chai";

describe("POST /api/v1/metric-category", () => {
	const server = agent(webServer(routes));
	const code = `code-${Date.now()}`;
	const orgId = parseInt(Date.now().toString().slice(0, 3));

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
		assert.isString(body.createdAt);
		assert.isString(body.updatedAt);
		assert.equal(body.region, "us");
		assert.isString(body.title, code);
		assert.equal(body.status, "active");
		assert.isString(body.arn);
	}).timeout(1800000);

	it("Should create second metric category", async () => {
		const { statusCode, body } = await server.post("/v1/metric-category").send({
			orgId: orgId,
			region: RegionEnum.US,
			title: code,
			code: code + "second",
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
		assert.equal(body.region, "us");
		assert.isString(body.title, code);
		assert.equal(body.status, "active");
		assert.isString(body.arn);
	}).timeout(1800000);

	it("Should return validation error", async () => {
		const { statusCode, body } = await server.post("/v1/metric-category").send({
			orgId: "main",
			region: "Ukraine",
			title: -1,
			code: -1,
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
		assert.isString(body.validation.body.status[0]);
	}).timeout(1800000);
});

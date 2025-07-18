import "../../../../src/app/providers";
import { assert } from "chai";
import { RegionEnum } from "@structured-growth/microservice-sdk";
import { initTest } from "../../../common/init-test";

describe("GET /api/v1/metric-category", () => {
	const { server, context } = initTest();
	const code = `code-${Date.now()}`;
	const orgId = parseInt(Date.now().toString().slice(0, 3));

	it("Should create metric category", async () => {
		const { statusCode, body } = await server.post("/v1/metric-category").send({
			orgId: orgId,
			region: RegionEnum.US,
			title: code,
			code: code,
			metadata: {
				specUrl: "https://",
				countryCode: "test",
			},
		});
		assert.equal(statusCode, 201);
		assert.isNumber(body.id);
		context.createdMetricCategoryId = body.id;
	}).timeout(1800000);

	it("Should return validation error", async () => {
		const { statusCode, body } = await server.get("/v1/metric-category").query({
			orgId: "fFf",
			accountId: "mainAccount",
			region: "Ukraine",
			title: -2,
			code: -12,
			status: "super",
		});
		assert.equal(statusCode, 422);
		assert.equal(body.name, "ValidationError");
		assert.isString(body.validation.query.orgId[0]);
		assert.isString(body.validation.query.status[0][0]);
		assert.isString(body.validation.query.title[0]);
		assert.isString(body.validation.query.code[0]);
		assert.isString(body.validation.query.orgId[0]);
	}).timeout(1800000);

	it("Should return created metric category by id", async () => {
		const { statusCode, body } = await server.get("/v1/metric-category").query({
			"id[0]": context["createdMetricCategoryId"],
			orgId: orgId,
			includeInherited: false,
		});
		assert.equal(statusCode, 200);
		assert.equal(body.data[0].id, context["createdMetricCategoryId"]);
		assert.isString(body.data[0].createdAt);
		assert.isString(body.data[0].updatedAt);
		assert.equal(body.data[0].status, "inactive");
		assert.equal(body.data[0].code, code);
		assert.isString(body.data[0].arn);
		assert.equal(body.data[0].orgId, orgId);
		assert.equal(body.data[0].title, code);
		assert.equal(body.page, 1);
		assert.equal(body.limit, 20);
		assert.equal(body.total, 1);
	}).timeout(1800000);

	it("Should search by code", async () => {
		const { statusCode, body } = await server.get("/v1/metric-category").query({
			"title[0]": code,
			orgId: orgId,
			includeInherited: false,
		});
		assert.equal(statusCode, 200);
		assert.equal(body.total, 1);
		assert.equal(body.data[0].id, context["createdMetricCategoryId"]);
	}).timeout(1800000);

	it("Should return error if one status is invalid", async () => {
		const { statusCode, body } = await server.get("/v1/metric-category").query({
			"status[0]": "deleted",
			"status[1]": "active",
		});
		assert.equal(statusCode, 422);
		assert.isNotEmpty(body.validation.query.status[0]);
	}).timeout(1800000);

	it("Should return created metric category by status", async () => {
		const { statusCode, body } = await server.get("/v1/metric-category").query({
			"status[0]": "inactive",
			"status[1]": "active",
			orgId: orgId,
			includeInherited: false,
		});
		assert.equal(statusCode, 200);
	}).timeout(1800000);
});

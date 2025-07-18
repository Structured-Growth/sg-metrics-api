import "../../../../src/app/providers";
import { assert } from "chai";
import { App } from "../../../../src/app/app";
import { container, webServer } from "@structured-growth/microservice-sdk";
import { routes } from "../../../../src/routes";
import { RegionEnum } from "@structured-growth/microservice-sdk";
import { initTest } from "../../../common/init-test";

describe("GET /api/v1/metric-type", () => {
	const { server, context } = initTest();
	const code = `code-${Date.now()}`;
	const orgId = parseInt(Date.now().toString().slice(0, 3));
	const factor = parseInt(Date.now().toString().slice(0, 2));
	const version = orgId - factor;
	const accountId = orgId - factor - factor;

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
	}).timeout(1800000);

	it("Should create metric type", async () => {
		const { statusCode, body } = await server.post("/v1/metric-type").send({
			orgId: orgId,
			accountId: accountId,
			region: RegionEnum.US,
			metricCategoryId: context.createdMetricCategoryId,
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
	}).timeout(1800000);

	it("Should return validation error", async () => {
		const { statusCode, body } = await server.get("/v1/metric-type").query({
			orgId: "fFf",
			accountId: "mainAcccount",
			region: "Ukraine",
			metricCategoryId: -9,
			title: -2,
			code: "123345678901234567890123456789012345678901234567890",
			unit: "12345678901234567890123456789012345678901234567890123456789012345678901234567890",
			factor: "fFf",
			relatedTo: "12345678901234567890123456789012345678901234567890123456789012345678901234567890",
			version: -14,
			status: "super",
		});
		assert.equal(statusCode, 422);
		assert.equal(body.name, "ValidationError");
		assert.isString(body.validation.query.status[0][0]);
		assert.isString(body.validation.query.title[0]);
		assert.isString(body.validation.query.unit[0]);
		assert.isString(body.validation.query.factor[0]);
		assert.isString(body.validation.query.relatedTo[0]);
		assert.isString(body.validation.query.version[0]);
		assert.isString(body.validation.query.metricCategoryId[0]);
		assert.isString(body.validation.query.orgId[0]);
		assert.isString(body.validation.query.accountId[0]);
	}).timeout(1800000);

	it("Should return created metric type by id", async () => {
		const { statusCode, body } = await server.get("/v1/metric-type").query({
			orgId,
			"id[0]": context["createdMetricTypeId"],
			includeInherited: false,
		});
		assert.equal(statusCode, 200);
		assert.equal(body.data[0].id, context["createdMetricTypeId"]);
		assert.equal(body.data[0].metricCategoryId, context["createdMetricCategoryId"]);
		assert.isString(body.data[0].createdAt);
		assert.isString(body.data[0].updatedAt);
		assert.equal(body.data[0].code, code);
		assert.equal(body.data[0].accountId, accountId);
		assert.equal(body.data[0].status, "inactive");
		assert.isString(body.data[0].arn);
		assert.equal(body.data[0].orgId, orgId);
		assert.equal(body.data[0].title, code);
		assert.equal(body.data[0].code, code);
		assert.equal(body.data[0].unit, code);
		assert.equal(body.data[0].factor, factor);
		assert.equal(body.data[0].relatedTo, code);
		assert.equal(body.data[0].version, version);
		assert.equal(body.page, 1);
		assert.equal(body.limit, 20);
		assert.equal(body.total, 1);
	}).timeout(1800000);

	it("Should search by code", async () => {
		const { statusCode, body } = await server.get("/v1/metric-type").query({
			"title[0]": code,
			orgId,
			includeInherited: false,
		});
		assert.equal(statusCode, 200);
		assert.equal(body.data[0].id, context["createdMetricTypeId"]);
		assert.equal(body.data[0].metricCategoryId, context["createdMetricCategoryId"]);
		assert.isString(body.data[0].createdAt);
		assert.isString(body.data[0].updatedAt);
		assert.equal(body.data[0].code, code);
		assert.equal(body.data[0].accountId, accountId);
		assert.equal(body.data[0].status, "inactive");
		assert.isString(body.data[0].arn);
		assert.equal(body.data[0].orgId, orgId);
		assert.equal(body.data[0].title, code);
		assert.equal(body.data[0].code, code);
		assert.equal(body.data[0].unit, code);
		assert.equal(body.data[0].factor, factor);
		assert.equal(body.data[0].relatedTo, code);
		assert.equal(body.data[0].version, version);
		assert.equal(body.page, 1);
		assert.equal(body.limit, 20);
		assert.equal(body.total, 1);
	}).timeout(1800000);

	it("Should return error if one status is invalid", async () => {
		const { statusCode, body } = await server.get("/v1/metric-type").query({
			"status[0]": "deleted",
			"status[1]": "active",
			orgId,
		});
		assert.equal(statusCode, 422);
		assert.isNotEmpty(body.validation.query.status[0]);
	}).timeout(1800000);

	it("Should return created metric type by status", async () => {
		const { statusCode, body } = await server.get("/v1/metric-type").query({
			"status[0]": "inactive",
			"status[1]": "active",
			"title[0]": code,
			orgId,
			includeInherited: false,
		});
		assert.equal(statusCode, 200);
		assert.equal(body.data[0].id, context["createdMetricTypeId"]);
		assert.equal(body.data[0].metricCategoryId, context["createdMetricCategoryId"]);
		assert.isString(body.data[0].createdAt);
		assert.isString(body.data[0].updatedAt);
		assert.equal(body.data[0].code, code);
		assert.equal(body.data[0].accountId, accountId);
		assert.equal(body.data[0].status, "inactive");
		assert.isString(body.data[0].arn);
		assert.equal(body.data[0].orgId, orgId);
		assert.equal(body.data[0].title, code);
		assert.equal(body.data[0].code, code);
		assert.equal(body.data[0].unit, code);
		assert.equal(body.data[0].factor, factor);
		assert.equal(body.data[0].relatedTo, code);
		assert.equal(body.data[0].version, version);
		assert.equal(body.page, 1);
		assert.equal(body.limit, 20);
		assert.equal(body.total, 1);
	}).timeout(1800000);

	it("Should return created metric type by created Metric Category Id", async () => {
		const { statusCode, body } = await server.get("/v1/metric-type").query({
			metricCategoryId: context.createdMetricCategoryId,
			orgId,
			includeInherited: false,
		});
		assert.equal(statusCode, 200);
		assert.equal(body.data[0].id, context["createdMetricTypeId"]);
		assert.equal(body.data[0].metricCategoryId, context["createdMetricCategoryId"]);
		assert.isString(body.data[0].createdAt);
		assert.isString(body.data[0].updatedAt);
		assert.equal(body.data[0].code, code);
		assert.equal(body.data[0].accountId, accountId);
		assert.equal(body.data[0].status, "inactive");
		assert.isString(body.data[0].arn);
		assert.equal(body.data[0].orgId, orgId);
		assert.equal(body.data[0].title, code);
		assert.equal(body.data[0].code, code);
		assert.equal(body.data[0].unit, code);
		assert.equal(body.data[0].factor, factor);
		assert.equal(body.data[0].relatedTo, code);
		assert.equal(body.data[0].version, version);
		assert.equal(body.page, 1);
		assert.equal(body.limit, 20);
		assert.equal(body.total, 1);
	}).timeout(1800000);
});

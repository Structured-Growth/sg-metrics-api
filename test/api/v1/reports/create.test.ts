import "../../../../src/app/providers";
import { App } from "../../../../src/app/app";
import { container } from "@structured-growth/microservice-sdk";
import { assert } from "chai";
import { initTest } from "../../../common/init-test";
import { seedReportCustomFields } from "../../../common/seed-custom-fields";

describe("POST /api/v1/reports", () => {
	const { server } = initTest();
	const orgId = Math.floor(Math.random() * 1000000) + 1;
	const accountId = Math.floor(Math.random() * 1000000) + 1;

	before(async () => {
		await container.resolve<App>("App").ready;
		await seedReportCustomFields(orgId);
	});

	it("Should create report with metadata", async () => {
		const { statusCode, body } = await server.post("/v1/reports").send({
			orgId,
			region: "us",
			accountId,
			title: "Quarterly report",
			inDashboard: true,
			reportParameters: '{"period":"Q1"}',
			metadata: {
				reportCode: "R1",
			},
		});

		assert.equal(statusCode, 201);
		assert.isNumber(body.id);
		assert.equal(body.orgId, orgId);
		assert.equal(body.region, "us");
		assert.equal(body.accountId, accountId);
		assert.equal(body.title, "Quarterly report");
		assert.equal(body.inDashboard, true);
		assert.equal(body.reportParameters, '{"period":"Q1"}');
		assert.equal(body.metadata.reportCode, "R1");
		assert.isString(body.arn);
		assert.include(body.arn, `:reports/${body.id}`);
		assert.isString(body.createdAt);
		assert.isString(body.updatedAt);
	});

	it("Should return Joi validation error for invalid request body", async () => {
		const { statusCode, body } = await server.post("/v1/reports").send({
			orgId: "bad",
			region: "u",
			accountId: "bad",
			title: 1,
			inDashboard: "bad",
			reportParameters: 2,
			metadata: "bad",
		});

		assert.equal(statusCode, 422);
		assert.equal(body.name, "ValidationError");
		assert.isString(body.validation.body.orgId[0]);
		assert.isString(body.validation.body.region[0]);
		assert.isString(body.validation.body.accountId[0]);
		assert.isString(body.validation.body.title[0]);
		assert.isString(body.validation.body.inDashboard[0]);
		assert.isString(body.validation.body.reportParameters[0]);
		assert.isString(body.validation.body.metadata[0]);
	});

	it("Should return custom fields validation error for invalid metadata", async () => {
		const { statusCode, body } = await server.post("/v1/reports").send({
			orgId,
			region: "us",
			accountId,
			title: "Broken report",
			inDashboard: false,
			reportParameters: '{"period":"Q2"}',
			metadata: {
				reportCode: "R",
			},
		});

		assert.equal(statusCode, 422);
		assert.equal(body.name, "ValidationError");
		assert.isString(body.validation.body.metadata.reportCode[0]);
	});
});

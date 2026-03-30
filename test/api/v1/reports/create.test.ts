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
			reportParameters: "{\"period\":\"Q1\"}",
			metadata: {
				reportCode: "R1",
			},
		});

		assert.equal(statusCode, 201);
		assert.isNumber(body.id);
		assert.equal(body.metadata.reportCode, "R1");
	});

	it("Should return validation error for invalid metadata", async () => {
		const { statusCode, body } = await server.post("/v1/reports").send({
			orgId,
			region: "us",
			accountId,
			title: "Broken report",
			inDashboard: false,
			reportParameters: "{\"period\":\"Q2\"}",
			metadata: {
				reportCode: "R",
			},
		});

		assert.equal(statusCode, 422);
		assert.equal(body.name, "ValidationError");
		assert.isString(body.validation.body.metadata.reportCode[0]);
	});
});

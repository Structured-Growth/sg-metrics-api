import "../../../../src/app/providers";
import { App } from "../../../../src/app/app";
import { container } from "@structured-growth/microservice-sdk";
import { assert } from "chai";
import { initTest } from "../../../common/init-test";
import { seedReportCustomFields } from "../../../common/seed-custom-fields";

describe("PUT /api/v1/reports/:reportId", () => {
	const { server } = initTest();
	const orgId = Math.floor(Math.random() * 1000000) + 1;
	const accountId = Math.floor(Math.random() * 1000000) + 1;
	let reportId: number;

	before(async () => {
		await container.resolve<App>("App").ready;
		await seedReportCustomFields(orgId);
		const { body } = await server.post("/v1/reports").send({
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
		reportId = body.id;
	});

	it("Should update report metadata", async () => {
		const { statusCode, body } = await server.put(`/v1/reports/${reportId}`).send({
			title: "Quarterly report v2",
			metadata: {
				reportCode: "R2",
			},
		});

		assert.equal(statusCode, 200);
		assert.equal(body.title, "Quarterly report v2");
		assert.equal(body.metadata.reportCode, "R2");
	});
});

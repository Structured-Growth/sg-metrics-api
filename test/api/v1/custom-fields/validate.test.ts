import "../../../../src/app/providers";
import { assert } from "chai";
import { initTest } from "../../../common/init-test";
import { seedReportCustomFields } from "../../../common/seed-custom-fields";

describe("POST /api/v1/custom-fields/validate", () => {
	const { server } = initTest();
	const orgId = Math.floor(Math.random() * 1000000) + 1;

	before(async () => {
		await seedReportCustomFields(orgId);
	});

	it("Should return successful validation result", async () => {
		const { statusCode, body } = await server.post("/v1/custom-fields/validate").send({
			entity: "Report",
			orgId,
			data: {
				reportCode: "OK",
			},
		});

		assert.equal(statusCode, 200);
		assert.equal(body.valid, true);
		assert.isUndefined(body.errors);
	});

	it("Should return validation result with errors", async () => {
		const { statusCode, body } = await server.post("/v1/custom-fields/validate").send({
			entity: "Report",
			orgId,
			data: {
				reportCode: "O",
			},
		});

		assert.equal(statusCode, 200);
		assert.equal(body.valid, false);
		assert.isString(body.errors.reportCode[0]);
	});
});

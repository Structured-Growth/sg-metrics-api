import "../../../../src/app/providers";
import { assert } from "chai";
import { initTest } from "../../../common/init-test";

describe("GET /api/v1/custom-fields", () => {
	const { server, context } = initTest();
	const orgId = Math.floor(Math.random() * 1000000) + 1;

	it("Should create custom field", async () => {
		const { statusCode, body } = await server.post("/v1/custom-fields").send({
			orgId,
			region: "us",
			entity: "Report",
			title: "Report Code",
			name: "reportCode",
			schema: { type: "string" },
			status: "active",
		});

		assert.equal(statusCode, 201);
		context.customFieldId = body.id;
	});

	it("Should return validation error", async () => {
		const { statusCode, body } = await server.get("/v1/custom-fields").query({
			orgId: "bad",
			"entity[0]": "VeryLongEntity".repeat(40),
			"status[0]": "bad",
		});

		assert.equal(statusCode, 422);
		assert.equal(body.name, "ValidationError");
		assert.isString(body.validation.query.orgId[0]);
		assert.isString(body.validation.query.entity[0][0]);
		assert.isString(body.validation.query.status[0][0]);
	});

	it("Should search custom fields", async () => {
		const { statusCode, body } = await server.get("/v1/custom-fields").query({
			orgId,
			"id[0]": context.customFieldId,
			"entity[0]": "Report",
			"title[0]": "Report*",
			"name[0]": "reportCode",
			"status[0]": "active",
		});

		assert.equal(statusCode, 200);
		assert.equal(body.total, 1);
		assert.equal(body.data[0].id, context.customFieldId);
		assert.equal(body.data[0].entity, "Report");
	});
});

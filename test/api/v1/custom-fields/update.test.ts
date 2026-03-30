import "../../../../src/app/providers";
import { assert } from "chai";
import { initTest } from "../../../common/init-test";

describe("PUT /api/v1/custom-fields/:customFieldId", () => {
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

	it("Should update custom field", async () => {
		const { statusCode, body } = await server.put(`/v1/custom-fields/${context.customFieldId}`).send({
			title: "Updated Report Code",
			name: "updatedReportCode",
			schema: { type: "string", min: 3 },
			status: "inactive",
		});

		assert.equal(statusCode, 200);
		assert.equal(body.id, context.customFieldId);
		assert.equal(body.title, "Updated Report Code");
		assert.equal(body.name, "updatedReportCode");
		assert.equal(body.schema.min, 3);
		assert.equal(body.status, "inactive");
	});

	it("Should return validation error", async () => {
		const { statusCode, body } = await server.put(`/v1/custom-fields/${context.customFieldId}`).send({
			title: 1,
			name: 2,
			schema: "bad",
			status: "bad",
		});

		assert.equal(statusCode, 422);
		assert.equal(body.name, "ValidationError");
		assert.isString(body.validation.body.title[0]);
		assert.isString(body.validation.body.name[0]);
		assert.isString(body.validation.body.schema[0]);
		assert.isString(body.validation.body.status[0]);
	});
});

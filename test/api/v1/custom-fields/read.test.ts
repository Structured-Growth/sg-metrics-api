import "../../../../src/app/providers";
import { assert } from "chai";
import { initTest } from "../../../common/init-test";
import { customFieldAlternativesSchema } from "../../../common/custom-field-schema";

describe("GET /api/v1/custom-fields/:customFieldId", () => {
	const { server, context } = initTest();
	const orgId = Math.floor(Math.random() * 1000000) + 1;

	it("Should create custom field", async () => {
		const { statusCode, body } = await server.post("/v1/custom-fields").send({
			orgId,
			entity: "Report",
			title: "Report Code",
			name: "reportCode",
			schema: customFieldAlternativesSchema,
			status: "active",
		});

		assert.equal(statusCode, 201);
		context.customFieldId = body.id;
	});

	it("Should read custom field", async () => {
		const { statusCode, body } = await server.get(`/v1/custom-fields/${context.customFieldId}`);

		assert.equal(statusCode, 200);
		assert.equal(body.id, context.customFieldId);
		assert.equal(body.orgId, orgId);
		assert.equal(body.region, "us");
		assert.equal(body.entity, "Report");
		assert.equal(body.name, "reportCode");
		assert.equal(body.schema.type, "alternatives");
	});

	it("Should return not found", async () => {
		const { statusCode, body } = await server.get("/v1/custom-fields/999999");

		assert.equal(statusCode, 404);
		assert.equal(body.name, "NotFound");
	});
});

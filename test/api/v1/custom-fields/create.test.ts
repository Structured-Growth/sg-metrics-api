import "../../../../src/app/providers";
import { assert } from "chai";
import { initTest } from "../../../common/init-test";
import { customFieldAlternativesSchema } from "../../../common/custom-field-schema";

describe("POST /api/v1/custom-fields", () => {
	const { server } = initTest();
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
		assert.isNumber(body.id);
		assert.equal(body.orgId, orgId);
		assert.equal(body.region, "us");
		assert.equal(body.entity, "Report");
		assert.equal(body.name, "reportCode");
		assert.equal(body.schema.type, "alternatives");
	});

	it("Should return validation error", async () => {
		const { statusCode, body } = await server.post("/v1/custom-fields").send({
			orgId: "wrong",
			entity: 1,
			title: 2,
			name: 3,
			schema: "wrong",
			status: "bad",
		});

		assert.equal(statusCode, 422);
		assert.equal(body.name, "ValidationError");
		assert.isString(body.validation.body.orgId[0]);
		assert.isString(body.validation.body.entity[0]);
		assert.isString(body.validation.body.title[0]);
		assert.isString(body.validation.body.name[0]);
		assert.isString(body.validation.body.schema[0]);
		assert.isString(body.validation.body.status[0]);
	});

	it("Should return validation error for invalid name characters", async () => {
		const { statusCode, body } = await server.post("/v1/custom-fields").send({
			orgId,
			entity: "Report",
			title: "Report Code",
			name: "report code!",
			schema: customFieldAlternativesSchema,
			status: "active",
		});

		assert.equal(statusCode, 422);
		assert.equal(body.name, "ValidationError");
		assert.isString(body.validation.body.name[0]);
	});

	it("Should return validation error for duplicate custom field", async () => {
		const { statusCode, body } = await server.post("/v1/custom-fields").send({
			orgId,
			entity: "Report",
			title: "Another Report Code",
			name: "reportCode",
			schema: customFieldAlternativesSchema,
			status: "active",
		});

		assert.equal(statusCode, 422);
		assert.equal(body.name, "ValidationError");
		assert.isString(body.validation.body.name[0]);
	});
});

import "../../../../src/app/providers";
import { assert } from "chai";
import { App } from "../../../../src/app/app";
import { container, webServer } from "@structured-growth/microservice-sdk";
import { agent } from "supertest";
import { routes } from "../../../../src/routes";

describe("GET /api/v1/examples", () => {
	const server = agent(webServer(routes));

	before(async () => container.resolve<App>("App").ready);

	it("Should return validation error", async () => {
		const { statusCode, body } = await server.get("/v1/examples").query({
			orgId: 1,
		});
		assert.equal(statusCode, 422);
		assert.equal(body.name, "ValidationError");
		assert.isString(body.validation.query.accountId[0]);
	});

	// it("Should return Example entities", async () => {
	// 	const response = await controller.search("as", {
	// 		orgId: -11,
	// 		accountId: -1,
	// 		status: "",
	// 	} as any);
	// 	assert.isUndefined(response);
	// });
});

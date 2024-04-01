import "../../../../src/app/providers";
import { assert } from "chai";
import { initTest } from "../../../common/init-test";

describe("POST /api/v1/system/migrate", () => {
	const { server } = initTest();

	it("Should return validation error", async () => {
		const { statusCode, body } = await server.post("/v1/system/migrate");
		assert.equal(statusCode, 200);
	});
});

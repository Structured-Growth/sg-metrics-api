import "../src/app/providers";
import { assert } from "chai";
import { App } from "../src/app/app";
import { container, NotFoundError } from "@structured-growth/microservice-sdk";
import { ResolverController } from "../src/controllers/v1";

describe("Test resolver", () => {
	const controller = new ResolverController();
	const app = container.resolve<App>("App");

	before(async () => app.ready);

	it("Should return resolved model", async () => {
		try {
			await controller.resolve({
				resource: "Unknown",
				id: 1,
			});
		} catch (e) {
			assert.isTrue(e instanceof NotFoundError);
		}
	});

	it("Should return list of actions", async () => {
		const { data } = await controller.actions();
		assert.isArray(data);
		assert.equal(data.filter((item) => item.action.includes("resolve")).length, 3);
	});

	it("Should return list of models", async () => {
		const { data } = await controller.models();
		assert.isString(data[0].resource);
	});
});

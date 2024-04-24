import "../../../../src/app/providers";
import { assert } from "chai";
import { App } from "../../../../src/app/app";
import { container, webServer } from "@structured-growth/microservice-sdk";
import { agent } from "supertest";
import { routes } from "../../../../src/routes";
import { RegionEnum } from "@structured-growth/microservice-sdk";

describe("PUT /api/v1/metric-category/:metricCategoryId", () => {
	const server = agent(webServer(routes));
	const code = `code-${Date.now()}`;
	let metric;

	before(async () => container.resolve<App>("App").ready);

	it("Should create metric category", async () => {
		const { statusCode, body } = await server.post("/v1/metric-category").send({
			orgId: 1,
			accountId: 1,
			region: RegionEnum.US,
			title: code,
			code: code,
			status: "active",
			metadata: {
				specUrl: "https://",
				countryCode: "test",
			},
		});

		metric = body;
	});

	it("Should udpate metric category", async () => {
		const { statusCode, body } = await server.put(`/v1/metric-category/${metric.id}`).send({
			title: code + "-updated",
			metadata: {
				specUrl: "https://updated",
				countryCode: "test+updated",
			},
		});

		metric = body;
	});
});

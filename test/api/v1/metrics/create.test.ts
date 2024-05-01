import "../../../../src/app/providers";
import { App } from "../../../../src/app/app";
import { container, webServer } from "@structured-growth/microservice-sdk";
import { agent } from "supertest";
import { routes } from "../../../../src/routes";
import { RegionEnum } from "@structured-growth/microservice-sdk";

describe("POST /api/v1/metrics", () => {
	const server = agent(webServer(routes));

	before(async () => container.resolve<App>("App").ready);

	it("Should create a metric", async () => {
		const { statusCode, body } = await server.post("/v1/metrics").send({
			orgId: 1,
			accountId: 1,
			userId: 1,
			metricCategoryId: 1,
			metricTypeId: 1,
			metricTypeVersion: 1,
			deviceId: 1,
			batchId: "1",
			value: 3660,
			takenAt: new Date().toISOString(),
			takenAtOffset: 0,
		});
	});
});

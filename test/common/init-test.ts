import { waitAppIsReady } from "./wait-app-is-ready";
import { agent } from "supertest";
import { webServer } from "@structured-growth/microservice-sdk";
import { routes } from "../../src/routes";

export function initTest() {
	const server = agent(webServer(routes));
	const context: Record<any, any> = {};

	waitAppIsReady();

	return { server, context };
}

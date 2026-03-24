import { waitAppIsReady } from "./wait-app-is-ready";
import { agent } from "supertest";
import { webServer, container } from "@structured-growth/microservice-sdk";
import { routes } from "../../src/routes";
import {
	installCustomFieldValidationMock,
	setCustomFieldValidationPayload,
} from "./mock-custom-field-validation";

export function initTest() {
	container.register("authenticationEnabled", { useValue: false });
	container.register("authorizationEnabled", { useValue: false });

	before(() => {
		installCustomFieldValidationMock();
	});

	beforeEach(() => {
		installCustomFieldValidationMock();
		setCustomFieldValidationPayload({ valid: true });
	});

	const server = agent(webServer(routes));
	const context: Record<any, any> = {};

	waitAppIsReady();

	return { server, context };
}

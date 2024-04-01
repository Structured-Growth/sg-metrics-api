import { container } from "@structured-growth/microservice-sdk";
import { App } from "../../src/app/app";

export function waitAppIsReady() {
	before(async () => container.resolve<App>("App").ready);
}

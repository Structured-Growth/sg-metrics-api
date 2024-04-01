import "./app/providers";
import { EventBridgeEvent, Handler, Context } from "aws-lambda";
import { App } from "./app/app";
import { container, Logger } from "@structured-growth/microservice-sdk";

const app = container.resolve<App>("App");
const logger = container.resolve<Logger>("Logger");

export const handler: Handler = async (event: EventBridgeEvent<string, object>, context: Context) => {
	await app.ready;

	logger.info("Handle event from EventBridge", event);
	return;
};

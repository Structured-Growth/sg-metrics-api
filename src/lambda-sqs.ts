import "./app/providers";
import { Handler, Context, SQSEvent } from "aws-lambda";
import { container, Logger } from "@structured-growth/microservice-sdk";
import { App } from "./app/app";

const app = container.resolve<App>("App");
const logger = container.resolve<Logger>("Logger");

export const handler: Handler = async (event: SQSEvent, context: Context) => {
	await app.ready;
	logger.info("Handle job from SQS", event);
	return;
};

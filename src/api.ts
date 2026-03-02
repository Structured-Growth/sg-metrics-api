import "./app/providers";
import { App } from "./app/app";
import { container, webServer, Logger } from "@structured-growth/microservice-sdk";
import { routes } from "./routes";
import { startSqsListener } from "./listeners";

export async function startWebServer() {
	const server = webServer(routes);
	const port = process.env.HTTP_PORT || 3300;
	const app = container.resolve<App>("App");
	const logger = container.resolve<Logger>("Logger");

	const isLambdaRuntime = Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME);

	await app.ready;

	if (isLambdaRuntime) {
		logger.info("Running in AWS Lambda runtime");
	}

	const shouldStartSqsListener = process.env.START_SQS_LISTENER_ON_WEBSERVER_STARTUP === "true";

	if (shouldStartSqsListener && !isLambdaRuntime) {
		startSqsListener();
	} else {
		logger.info("SQS subscriber is disabled");
	}

	server.listen(port);
	logger.info(`Web server is running on ${port} port`);
}

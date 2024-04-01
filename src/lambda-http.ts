import "./app/providers";
import { APIGatewayProxyEvent, Handler, Context } from "aws-lambda";
import { container, webServer } from "@structured-growth/microservice-sdk";
import * as serverless from "serverless-http";
import { App } from "./app/app";
import { routes } from "./routes";

const server = webServer(routes);
const _handler = serverless(server);
const app = container.resolve<App>("App");

export const handler: Handler = async (event: APIGatewayProxyEvent, context: Context) => {
	await app.ready;
	return _handler(event, context);
};

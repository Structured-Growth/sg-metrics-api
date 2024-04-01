import "./app/providers";
import { App } from "./app/app";
import { container, webServer, Logger } from "@structured-growth/microservice-sdk";
import { routes } from "./routes";

export async function startWebServer() {
	const server = webServer(routes);
	const port = process.env.HTTP_PORT || 3300;
	const app = container.resolve<App>("App");
	const logger = container.resolve<Logger>("Logger");

	await app.ready;

	server.listen(port);
	logger.info(`Web server is running on ${port} port`);
}

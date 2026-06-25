#!/usr/bin/env node
import "./app/providers";
import { AppMock } from "./app/app.mock";
import { container, generateApiDocs, Lifecycle, generateEmitsManifest } from "@structured-growth/microservice-sdk";
import { program } from "commander";
import { min } from "lodash";

const cluster = require("node:cluster");
const http = require("node:http");
const numCPUs = require("node:os").availableParallelism();
const process = require("node:process");
const maxWorkers = Math.max(Number(process.env.MAX_WORKERS) || 1, 1);

program.option("-e, --env-file <envFile>", "path to .env file", ".env");

program
	.command("web")
	.description("Runs a web server")
	.action(async () => {
		if (cluster.isPrimary) {
			console.log(`Primary ${process.pid} is running`);
			for (let i = 0; i < min([numCPUs, maxWorkers]); i++) {
				cluster.fork();
			}
			cluster.on("exit", (worker, code, signal) => {
				console.log(`worker ${worker.process.pid} died`);
			});
		} else {
			const { startWebServer } = await require("./api");
			await startWebServer();
			console.log(`Worker ${process.pid} started`);
		}
	});

program
	.command("docs")
	.description("Generate API docs")
	.action(async () => {
		container.register("App", AppMock, { lifecycle: Lifecycle.Singleton });
		const app = container.resolve<AppMock>("App");
		await app.ready;
		const specConfig = await require("../tsoa.v1.json");
		const controllers = await require("../src/controllers/v1");

		await generateApiDocs(app, controllers, container.resolve("appPrefix"), {
			...specConfig,
			outputDirectory: ".docs/openapi.v1",
			entryFile: "src/controllers/v1/index.ts",
			name: process.env.APP_PREFIX,
			version: process.env.APP_VERSION || "0.0.0",
			spec: {
				...specConfig.spec,
				servers: (process.env.API_DOCS_HOST_LIST || "").split(",").map((url) => ({ url })),
			},
		} as any);
		process.exit();
	});

program
	.command("events")
	.description("Generate emits manifest")
	.action(async () => {
		container.register("App", AppMock, { lifecycle: Lifecycle.Singleton });
		const app = container.resolve<AppMock>("App");
		await app.ready;
		const entries = generateEmitsManifest();
		console.log(`Generated emits manifest with ${entries.length} entr${entries.length === 1 ? "y" : "ies"}`);
		process.exit();
	});

program.parse(process.argv);

const { envFile } = program.opts();
process.env.__PATH_TO_ENV_FILE = envFile;

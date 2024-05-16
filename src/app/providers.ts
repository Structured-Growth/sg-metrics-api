import "reflect-metadata";
import "./load-environment";
import { App } from "./app";
import { container, Lifecycle, logWriters, Logger } from "@structured-growth/microservice-sdk";
import { loadEnvironment } from "./load-environment";
import { MetricTypeService } from "../modules/metric-type/metric-type.service";
import { MetricTypeRepository } from "../modules/metric-type/metric-type.repository";
import { MetricCategoryService } from "../modules/metric-category/metric-category.service";
import { MetricCategoryRepository } from "../modules/metric-category/metric-category.repository";
import { MetricRepository } from "../modules/metric/metric.repository";

// load and validate env variables
loadEnvironment();

// const
container.register("appPrefix", { useValue: process.env.APP_PREFIX });
container.register("stage", { useValue: process.env.STAGE });
container.register("region", { useValue: process.env.REGION });
container.register("isDev", { useValue: process.env.STAGE === "dev" });
container.register("isTest", { useValue: process.env.STAGE === "test" });
container.register("logDbRequests", { useValue: process.env.LOG_DB_REQUESTS === "true" });
container.register("logRequestBody", { useValue: process.env.LOG_HTTP_REQUEST_BODY === "true" });
container.register("logResponses", { useValue: process.env.LOG_HTTP_RESPONSES === "true" });

// services
container.register("LogWriter", logWriters[process.env.LOG_WRITER] || "ConsoleLogWriter", {
	lifecycle: Lifecycle.Singleton,
});
container.register("Logger", Logger);
container.register("App", App, { lifecycle: Lifecycle.Singleton });
container.register("MetricCategoryService", MetricCategoryService);
container.register("MetricTypeService", MetricTypeService);

// repositories
container.register("MetricCategoryRepository", MetricCategoryRepository);
container.register("MetricTypeRepository", MetricTypeRepository);
container.register("MetricRepository", MetricRepository);
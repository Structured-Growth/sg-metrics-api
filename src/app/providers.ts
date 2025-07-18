import "reflect-metadata";
import "./load-environment";
import { App } from "./app";
import {
	container,
	Lifecycle,
	logWriters,
	Logger,
	AuthService,
	PolicyService,
	eventBusProviders,
	EventbusService,
} from "@structured-growth/microservice-sdk";
import { loadEnvironment } from "./load-environment";
import { MetricService } from "../modules/metric/metric.service";
import { MetricTypeService } from "../modules/metric-type/metric-type.service";
import { MetricTypeRepository } from "../modules/metric-type/metric-type.repository";
import { MetricCategoryService } from "../modules/metric-category/metric-category.service";
import { MetricCategoryRepository } from "../modules/metric-category/metric-category.repository";
import { MetricTimestreamRepository } from "../modules/metric/repositories/metric-timestream.repository";
import { ReportsRepository } from "../modules/reports/reports.repository";
import { ReportsService } from "../modules/reports/reports.service";
import { MetricSqlRepository } from "../modules/metric/repositories/metric-sql.repository";

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

container.register("authenticationEnabled", { useValue: process.env.AUTHENTICATION_ENABLED === "true" });
container.register("authorizationEnabled", { useValue: process.env.AUTHORIZATION_ENABLED === "true" });
container.register("internalAuthenticationEnabled", {
	useValue: process.env.INTERNAL_AUTHENTICATION_ENABLED === "true",
});
container.register("internalRequestsAllowed", { useValue: process.env.INTERNAL_REQUESTS_ALLOWED === "true" });
container.register("internalAuthenticationJwtSecret", { useValue: process.env.INTERNAL_AUTHENTICATION_JWT_SECRET });
container.register("oAuthServiceGetUserUrl", { useValue: process.env.OAUTH_USER_URL });
container.register("policiesServiceUrl", { useValue: process.env.POLICY_SERVICE_URL });

container.register("accountApiUrl", { useValue: process.env.ACCOUNT_API_URL });

// services
container.register("LogWriter", logWriters[process.env.LOG_WRITER] || "ConsoleLogWriter", {
	lifecycle: Lifecycle.Singleton,
});
container.register("Logger", Logger);
container.register("App", App, { lifecycle: Lifecycle.Singleton });
container.register("AuthService", AuthService);
container.register("PolicyService", PolicyService);
container.register("MetricService", MetricService);
container.register("MetricCategoryService", MetricCategoryService);
container.register("MetricTypeService", MetricTypeService);
container.register("ReportsService", ReportsService);

container.register("eventbusName", { useValue: process.env.EVENTBUS_NAME || "sg-eventbus-dev" });
container.register("EventbusProvider", eventBusProviders[process.env.EVENTBUS_PROVIDER || "TestEventbusProvider"]);
container.register("EventbusService", EventbusService);

// repositories
container.register("MetricCategoryRepository", MetricCategoryRepository);
container.register("MetricTypeRepository", MetricTypeRepository);
container.register("MetricTimestreamRepository", MetricTimestreamRepository);
container.register("ReportsRepository", ReportsRepository);
container.register("MetricSqlRepository", MetricSqlRepository);

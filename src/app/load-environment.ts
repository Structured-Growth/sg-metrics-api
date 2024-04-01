import {joi, ConfigLoader } from "@structured-growth/microservice-sdk";
// import * as joi from "joi";

export function loadEnvironment() {
	const loader = new ConfigLoader();
	loader.loadAndValidate(process.env.__PATH_TO_ENV_FILE || ".env", {
		APP_PREFIX: joi.string().required().max(30).min(2),
		HTTP_PORT: joi.number().positive().required(),
		STAGE: joi.string().valid("dev", "qual", "prod").required(),
		REGION: joi
			.valid(
				"us-east-1",
				"us-east-2",
				"us-west-1",
				"us-west-2",
				"ap-south-1",
				"ap-northeast-3",
				"ap-northeast-2",
				"ap-southeast-1",
				"ap-southeast-2",
				"ap-northeast-1",
				"ca-central-1",
				"eu-central-1",
				"eu-west-1",
				"eu-west-2",
				"eu-west-3",
				"eu-north-1",
				"sa-east-1"
			)
			.required(),
		URI_PATH_PREFIX: joi.string().allow(""),
		LOG_LEVEL: joi.string().valid("debug", "notice", "info", "warning", "error").required(),
		LOG_DB_REQUESTS: joi.bool().required(),
		LOG_HTTP_REQUEST_BODY: joi.bool().required(),
		LOG_HTTP_RESPONSES: joi.bool().required(),
		LOG_WRITER: joi.string().valid("ConsoleLogWriter", "LambdaConsoleLogWriter").required(),
		DB_HOST: joi.string().required(),
		DB_PORT: joi.number().required(),
		DB_DATABASE: joi.string().required(),
		DB_USERNAME: joi.string().required(),
		DB_PASSWORD: joi.string().required(),
		DB_SCHEMA: joi.string().required(),
		DB_MIGRATION_TABLE_SCHEMA: joi.string().required(),
		DB_MIGRATION_TABLE_NAME: joi.string().required(),
	});
}

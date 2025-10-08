import "./app/providers";
import { getI18nInstance } from "@structured-growth/microservice-sdk";
import { Handler, Context, SQSEvent } from "aws-lambda";
import { container, Logger, BadRequestError, I18nType } from "@structured-growth/microservice-sdk";
import { App } from "./app/app";
import { MetricService } from "./modules/metric/metric.service";

const app = container.resolve<App>("App");
const logger = container.resolve<Logger>("Logger");

export const handler: Handler = async (event: SQSEvent, context: Context) => {
	await app.ready;
	logger.info("Handle job from SQS", event);

	const promises = [];

	for (const record of event.Records) {
		const promise = async () => {
			let body: any;
			try {
				body = JSON.parse(record.body);
			} catch (error) {
				throw new BadRequestError(`Malformed JSON in SQS: ${record.messageId}`);
			}

			const language = body.detail?.language || process.env.DEFAULT_LANGUAGE || "en-US";
			console.log(`Selected language for record ${record.messageId}: ${language}`);

			const i18nInstance = await getI18nInstance({ headers: { "accept-language": language } });

			container.register("i18n", {
				useValue: () => i18nInstance,
			});

			try {
				const metricService = container.resolve<MetricService>("MetricService");
				console.log("TEST_METRIC_SERVICE");
				await metricService.exportGenerationStreamed({
					params: body.detail.params,
					columns: body.detail.columns,
					email: body.detail.email,
				});

				return {
					messageId: record.messageId,
					status: "success",
				};
			} catch (error) {
				const getI18n = container.resolve<() => I18nType>("i18n");
				const i18n = getI18n();

				logger.error("SQS record processing failed", {
					messageId: record.messageId,
					error: error.message,
				});

				return {
					messageId: record.messageId,
					status: "error",
					error: `${i18n?.__("error.lambda.error_collecting") || "Error"}: ${error.message}`,
				};
			}
		};

		promises.push(promise());
	}

	const results = await Promise.all(promises);

	return {
		statusCode: 200,
		body: JSON.stringify({ results }),
	};
};

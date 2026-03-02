import { container, Logger, QueueService } from "@structured-growth/microservice-sdk";
import { handlers } from "./handlers";

export function startSqsListener(): void {
	const logger = container.resolve<Logger>("Logger");

	const queueUrl = container.resolve<string>("sqsQueueUrl");
	const queue = container.resolve<QueueService>("QueueService");

	queue.subscribe(queueUrl, async ({ source, subject, message }, event) => {
		logger.info({ source, subject }, "SQS message received");

		await Promise.all(handlers.map((h) => h(subject, message)));
	});

	logger.info("SQS subscriber started");
}

import { container, Logger, CacheService } from "@structured-growth/microservice-sdk";

export async function handlerCacheCleanerPolicyEvents(subject: string, message: any) {
	const logger = container.resolve<Logger>("Logger");
	const cacheService = container.resolve<CacheService>("CacheService");
	const appPrefix = container.resolve<string>("appPrefix");

	const action = message?.action;

	if (!action) {
		logger.warn({ subject, message }, "Policy event skipped: missing action");
		return;
	}

	// You can also do additional filtering at the Terraform DevOps level, namely through aws_cloudwatch_event_target
	switch (true) {
		case action === `${appPrefix}:metric-category/delete`: {
			const resourceArn = message?.resourceArn;

			if (!resourceArn) {
				logger.warn({ subject, action, message }, "Policy metric-category delete skipped: missing resourceArn");
				return;
			}

			await cacheService.invalidateTag(`metricCategory:entity:${resourceArn}`);

			logger.info({ subject, action, resourceArn }, "Cache invalidated by tag (metric-category delete)");
			return;
		}

		case action === `${appPrefix}:metric-type/delete`: {
			const resourceArn = message?.resourceArn;

			if (!resourceArn) {
				logger.warn({ subject, action, message }, "Policy metric-type delete skipped: missing resourceArn");
				return;
			}

			await cacheService.invalidateTag(`metricType:entity:${resourceArn}`);

			logger.info({ subject, action, resourceArn }, "Cache invalidated by tag (metric-type delete)");
			return;
		}

		default:
			logger.warn({ subject, action }, "Unknown policy event");
			return;
	}
}

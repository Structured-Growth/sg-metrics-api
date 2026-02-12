process.env.CACHE_TRANSPORT = "MemoryCacheTransport";
process.env.QUEUE_PROVIDER = "TestQueueProvider";
import "../../src/app/providers";
import { assert } from "chai";
import { container, CacheService, MemoryCacheTransport } from "@structured-growth/microservice-sdk";
import type { QueueProviderInterface } from "@structured-growth/microservice-sdk";
import type { Message } from "aws-sdk/clients/sqs";
import { startSqsListener } from "../../src/listeners";

class FakeQueueProvider implements QueueProviderInterface {
	public subscribedQueueUrl: string | null = null;
	public handler:
		| ((message: { source: string; subject: string; message: any }, event?: Message) => Promise<void> | void)
		| null = null;

	async publish(_queueName: string, _subject: string, _message: object): Promise<boolean> {
		return true;
	}

	subscribe(queueName: string, handler: any): void {
		this.subscribedQueueUrl = queueName;
		this.handler = handler;
	}
}

describe("SQS listener -> metric-type cache invalidation", () => {
	let cacheService: CacheService;
	let transport: MemoryCacheTransport;
	let fakeQueue: FakeQueueProvider;

	before(() => {
		cacheService = container.resolve<CacheService>("CacheService");
		transport = container.resolve<MemoryCacheTransport>("CacheTransport");
		assert.instanceOf(transport, MemoryCacheTransport);

		fakeQueue = new FakeQueueProvider();
		container.register("QueueProvider", { useValue: fakeQueue });

		container.register("sqsQueueUrl", { useValue: "https://example.com/fake-queue-url" });

		startSqsListener();

		assert.equal(fakeQueue.subscribedQueueUrl, "https://example.com/fake-queue-url");
		assert.isFunction(fakeQueue.handler);
	});

	it("must invalidate metricType:entity:arn tag on `${appPrefix}:metric-type/delete` event", async () => {
		const appPrefix = container.resolve<string>("appPrefix");

		const resourceArn = "sg-api:us:1:metric-types/101";
		const tag = `metricType:entity:${resourceArn}`;

		const keyById = "metricType:id:101";
		const keyByCode = "metricType:code:steps";

		await cacheService.setWithTags(keyById, { id: 101 }, [tag], 3600);
		await cacheService.setWithTags(keyByCode, { code: "steps" }, [tag], 3600);

		assert.isNotNull(await cacheService.get(keyById));
		assert.isNotNull(await cacheService.get(keyByCode));

		const keysBefore = await transport.getKeysByTag(tag);
		assert.include(keysBefore, keyById);
		assert.include(keysBefore, keyByCode);

		await fakeQueue.handler!(
			{
				source: "aws.events",
				subject: `${appPrefix}:metric-type/delete`,
				message: { action: `${appPrefix}:metric-type/delete`, resourceArn },
			},
			undefined
		);

		assert.isNull(await cacheService.get(keyById));
		assert.isNull(await cacheService.get(keyByCode));
		assert.deepEqual(await transport.getKeysByTag(tag), []);
	});

	it("must invalidate metricCategory:entity:arn tag on `${appPrefix}:metric-category/delete` event", async () => {
		const appPrefix = container.resolve<string>("appPrefix");

		const resourceArn = "sg-api:us:1:metric-categories/55";
		const tag = `metricCategory:entity:${resourceArn}`;

		const keyById = "metricCategory:id:55";
		const keyByCode = "metricCategory:code:activity";

		await cacheService.setWithTags(keyById, { id: 55 }, [tag], 3600);
		await cacheService.setWithTags(keyByCode, { code: "activity" }, [tag], 3600);

		assert.isNotNull(await cacheService.get(keyById));
		assert.isNotNull(await cacheService.get(keyByCode));

		await fakeQueue.handler!(
			{
				source: "aws.events",
				subject: `${appPrefix}:metric-category/delete`,
				message: { action: `${appPrefix}:metric-category/delete`, resourceArn },
			},
			undefined
		);

		assert.isNull(await cacheService.get(keyById));
		assert.isNull(await cacheService.get(keyByCode));
		assert.deepEqual(await transport.getKeysByTag(tag), []);
	});
});

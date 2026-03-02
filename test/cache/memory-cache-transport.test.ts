process.env.CACHE_TRANSPORT = "MemoryCacheTransport";
import { App } from "../../src/app/app";
import "../../src/app/providers";
import { container, CacheService, MemoryCacheTransport } from "@structured-growth/microservice-sdk";
import { RegionEnum } from "@structured-growth/microservice-sdk";
import { assert } from "chai";
import { initTest } from "../common/init-test";

describe("MemoryCacheTransport", () => {
	const { server, context } = initTest();

	let cacheService: CacheService;
	let transport: MemoryCacheTransport;

	const runId = Date.now();
	const orgId = Math.round(Date.now() / 1000);
	const region = RegionEnum.US;
	const code = `steps-${runId}`;

	before(async function () {
		this.timeout(60000);
		process.env.TRANSLATE_API_URL = "";

		await container.resolve<App>("App").ready;

		cacheService = container.resolve<CacheService>("CacheService");
		transport = container.resolve("CacheTransport");
		assert.instanceOf(transport, MemoryCacheTransport);

		const catRes = await server.post("/v1/metric-category").send({
			orgId,
			region,
			title: "Medicine",
			code: `test_medicine_${runId}`,
			status: "active",
			metadata: { specUrl: "https://", countryCode: "test" },
		});
		assert.equal(catRes.statusCode, 201);
		context.metricCategoryId = catRes.body.id;

		const mtRes = await server.post("/v1/metric-type").send({
			orgId,
			region,
			metricCategoryId: context.metricCategoryId,
			title: "Steps",
			code,
			unit: "count",
			factor: 1,
			relatedTo: "activity",
			version: 1,
			status: "active",
			metadata: { specUrl: "https://", countryCode: "test" },
		});
		assert.equal(mtRes.statusCode, 201);
		context.metricTypeId = mtRes.body.id;
		context.metricTypeArn = mtRes.body.arn;
	});

	after(async () => {
		await cacheService.invalidateTag(`metricType:entity:${context.metricTypeArn}`).catch(() => null);
		await cacheService.del(`metricType:id:${context.metricTypeId}`).catch(() => null);
		await cacheService.del(`metricType:code:${code}`).catch(() => null);
	});

	it("should cache metric type keys and tag after HTTP create", async () => {
		const cachedById = await cacheService.get<any>(`metricType:id:${context.metricTypeId}`);
		assert.isOk(cachedById);

		const cachedByCode = await cacheService.get<any>(`metricType:code:${code}`);
		assert.isOk(cachedByCode);

		const tag = `metricType:entity:${context.metricTypeArn}`;
		const keysByTag = await transport.getKeysByTag(tag);

		assert.include(keysByTag, `metricType:id:${context.metricTypeId}`);
		assert.include(keysByTag, `metricType:code:${code}`);
	});

	it("should invalidate cached keys via tag", async () => {
		const tag = `metricType:entity:${context.metricTypeArn}`;

		assert.isNotNull(await cacheService.get(`metricType:id:${context.metricTypeId}`));
		assert.isNotNull(await cacheService.get(`metricType:code:${code}`));

		const keysBefore = await transport.getKeysByTag(tag);
		assert.include(keysBefore, `metricType:id:${context.metricTypeId}`);
		assert.include(keysBefore, `metricType:code:${code}`);

		const removed = await cacheService.invalidateTag(tag);
		assert.isAtLeast(removed, 1);

		assert.isNull(await cacheService.get(`metricType:id:${context.metricTypeId}`));
		assert.isNull(await cacheService.get(`metricType:code:${code}`));
		assert.deepEqual(await transport.getKeysByTag(tag), []);
	});
});

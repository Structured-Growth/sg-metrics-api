process.env.CACHE_TRANSPORT = "MemoryCacheTransport";
import "../../src/app/providers";
import { container, CacheService, MemoryCacheTransport } from "@structured-growth/microservice-sdk";
import { assert } from "chai";
import { MetricTypeService } from "../../src/modules/metric-type/metric-type.service";

describe("MemoryCacheTransport", () => {
	let cacheService: CacheService;
	let transport: MemoryCacheTransport;
	let service: MetricTypeService;

	let searchCallCount = 0;

	const t1: any = {
		id: 101,
		code: "steps",
		arn: "sg-api:us:1:metric-types/101",
		orgId: 1,
		region: "us",
	};

	let originalMetricTypeRepo: any;
	let originalMetricCategoryRepo: any;
	let originalMetricSqlRepo: any;

	before(() => {
		cacheService = container.resolve<CacheService>("CacheService");

		transport = container.resolve("CacheTransport");
		assert.instanceOf(transport, MemoryCacheTransport);

		originalMetricTypeRepo = container.resolve("MetricTypeRepository");
		originalMetricCategoryRepo = container.resolve("MetricCategoryRepository");
		originalMetricSqlRepo = container.resolve("MetricSqlRepository");

		const metricTypeRepositoryMock: any = {
			read: async () => null,
			findByCode: async () => null,
			update: async () => null,
			create: async () => null,
			delete: async () => null,
			search: async (params: any) => {
				searchCallCount++;

				if (params?.id?.includes(t1.id)) {
					return { data: [t1] };
				}

				if (params?.code?.includes(t1.code)) {
					return { data: [t1] };
				}

				return { data: [] };
			},
		};

		const metricCategoryRepositoryMock: any = {
			search: async () => ({ data: [] }),
			findByCode: async () => null,
			read: async () => null,
			create: async () => null,
			update: async () => null,
			delete: async () => null,
		};

		const metricSqlRepositoryMock: any = {
			search: async () => ({ data: [] }),
		};

		container.registerInstance("MetricTypeRepository", metricTypeRepositoryMock);
		container.registerInstance("MetricCategoryRepository", metricCategoryRepositoryMock);
		container.registerInstance("MetricSqlRepository", metricSqlRepositoryMock);

		service = container.resolve(MetricTypeService);
	});

	beforeEach(() => {
		searchCallCount = 0;
	});

	afterEach(async () => {
		await cacheService.invalidateTag(`metricType:entity:${t1.arn}`).catch(() => null);
		await cacheService.del(`metricType:id:${t1.id}`).catch(() => null);
		await cacheService.del(`metricType:code:${t1.code}`).catch(() => null);
	});

	after(() => {
		container.registerInstance("MetricTypeRepository", originalMetricTypeRepo);
		container.registerInstance("MetricCategoryRepository", originalMetricCategoryRepo);
		container.registerInstance("MetricSqlRepository", originalMetricSqlRepo);
	});

	it("must cache metric type on first getByIds() call", async () => {
		const map = await service.getByIds([t1.id]);

		assert.equal(searchCallCount, 1);
		assert.isTrue(map.has(t1.id));

		const cachedById = await cacheService.get<any>(`metricType:id:${t1.id}`);
		const cachedByCode = await cacheService.get<any>(`metricType:code:${t1.code}`);

		assert.isOk(cachedById);
		assert.isOk(cachedByCode);
	});

	it("must reuse cache on second getByIds() call", async () => {
		await service.getByIds([t1.id]);
		assert.equal(searchCallCount, 1);

		await service.getByIds([t1.id]);
		assert.equal(searchCallCount, 1);
	});

	it("must attach entity tag and allow invalidation via invalidateTag", async () => {
		await service.getByIds([t1.id]);

		const keysByTag = await transport.getKeysByTag(`metricType:entity:${t1.arn}`);
		assert.include(keysByTag, `metricType:id:${t1.id}`);
		assert.include(keysByTag, `metricType:code:${t1.code}`);

		const removed = await cacheService.invalidateTag(`metricType:entity:${t1.arn}`);
		assert.isAtLeast(removed, 1);

		assert.isNull(await cacheService.get(`metricType:id:${t1.id}`));
		assert.isNull(await cacheService.get(`metricType:code:${t1.code}`));
	});
});

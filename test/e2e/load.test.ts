/**
 * 1. Generate 3600 metrics per day in range 2024-05-01 - 2024-05-14
 * 2. Split 50400 metrics into chunks by 500
 * 3. Send create requests in series
 * 4. Try to aggregate data with aggregation interval 1h
 * 4. Try to aggregate data with aggregation interval 6h
 * 4. Try to aggregate data with aggregation interval 30m
 * 4. Try to aggregate data with aggregation interval 1day
 *
 */

import "../../src/app/providers";
import { App } from "../../src/app/app";
import { container, webServer } from "@structured-growth/microservice-sdk";
import { agent } from "supertest";
import { routes } from "../../src/routes";
import { RegionEnum } from "@structured-growth/microservice-sdk";
import {assert} from "chai";
import { chunk } from "lodash";
import {initTest} from "../common/init-test";

describe("LOAD TEST /api/v1/metrics", () => {
    const { server, context } = initTest();
    const code = `code-${Date.now()}`;
    const userId = Date.now();

    const startDate = '2024-05-01';
    const endDate = '2024-05-14';
    const numMetricsPerDay = 3600;
    const chunkSize = 100;

    const moment = require('moment');

    function splitIntoChunks(array, chunkSize) {
        const chunks = [];
        for (let i = 0; i < array.length; i += chunkSize) {
            chunks.push(array.slice(i, i + chunkSize));
        }
        return chunks;
    }

    function generateMetrics(startDate, endDate, numMetrics) {
        const metrics = [];
        const start = moment(startDate).startOf('day').add(1, 'minute');
        const end = moment(endDate).endOf('day').subtract(1, 'minute');
        const days = end.diff(start, 'days') + 1;

        for (let i = 0; i < numMetrics; i++) {
            const randomDate = start.clone().add(Math.floor(Math.random() * days), 'days');
            const randomTime = moment({
                hour: Math.floor(Math.random() * 24),
                minute: Math.floor(Math.random() * 59)
            });
            randomDate.set({
                hour: randomTime.hour(),
                minute: randomTime.minute()
            });
            const metric = {
                orgId: 5,
                accountId: 5,
                userId: userId,
                metricCategoryId: context["createdMetricCategoryId"],
                metricTypeId: context["createdMetricTypeId"],
                metricTypeVersion: 1,
                deviceId: 101,
                batchId: "123456",
                value: Math.floor(Math.random() * (3900 - 3500 + 1)) + 3500,
                takenAt: randomDate.toISOString(),
                takenAtOffset: 90,
            };
            metrics.push(metric);
        }
        return metrics;
    }


    before(async () => container.resolve<App>("App").ready);

    it("Should create metric category", async () => {
        const { statusCode, body } = await server.post("/v1/metric-category").send({
            orgId: 5,
            region: RegionEnum.US,
            title: code,
            code: code,
            status: "active",
            metadata: {
                specUrl: "https://",
                countryCode: "test",
            },
        });
        assert.equal(statusCode, 201);
        assert.isNumber(body.id);
        context.createdMetricCategoryId = body.id;

    });

    it("Should create metric type", async () => {
        const { statusCode, body } = await server.post("/v1/metric-type").send({
            orgId: 5,
            region: RegionEnum.US,
            metricCategoryId: context["createdMetricCategoryId"],
            title: code,
            code: code,
            unit: code,
            factor: 1,
            relatedTo: code,
            version: 1,
            status: "inactive",
            metadata: {
                specUrl: "https://",
                countryCode: "test",
            },
        });
        assert.equal(statusCode, 201);
        assert.isNumber(body.id);
        context.createdMetricTypeId = body.id;
    });

    it("Should create metric", async () => {
        const { statusCode, body } = await server.post("/v1/metrics").send([
            {
            orgId: 1,
            accountId: 1,
            userId: userId,
            metricCategoryId: context["createdMetricCategoryId"],
            metricTypeId: 1,
            metricTypeVersion: context["createdMetricTypeId"],
            deviceId: 101,
            batchId: "1234567890",
            value: 35,
            takenAt: "2024-05-06T14:30:00+00:00",
            takenAtOffset: 90,
        }
        ]);
        assert.equal(statusCode, 201);

    });

    it("Should generate metrics", async () => {
        const allMetrics = [];
        for (let date = startDate; moment(date).isSameOrBefore(endDate); date = moment(date).add(1, 'day').format('YYYY-MM-DD')) {
            const metrics = generateMetrics(date, date, numMetricsPerDay);
            allMetrics.push(...metrics);
        }

        const metricChunks = splitIntoChunks(allMetrics, chunkSize);

        //assert.equal(allMetrics.length, numMetricsPerDay * moment(endDate).diff(startDate, 'days'));

        metricChunks.forEach(chunk => {
            assert.isAtMost(chunk.length, chunkSize);
        });
    });

    it("Should send metrics in series", async () => {
        const allMetrics = [];
        for (let date = startDate; moment(date).isSameOrBefore(endDate); date = moment(date).add(1, 'day').format('YYYY-MM-DD')) {
            const metrics = generateMetrics(date, date, numMetricsPerDay);
            allMetrics.push(...metrics);
        }

        const metricChunks = splitIntoChunks(allMetrics, chunkSize);

        for (const chunk of metricChunks) {
            try {
                const { statusCode, body } = await server.post("/v1/metrics").send(chunk);
                assert.equal(statusCode, 201);
            } catch (error) {
                console.error(`Error creating metrics: ${error.message}`);
            }
        }
    }).timeout(1800000);

    it("Should aggregate metrics", async () => {
        const { statusCode, body } = await server.get(`/v1/metrics/aggregate`).query({
            "aggregationInterval": "60d",
        });
        assert.equal(statusCode, 200);
    });

});

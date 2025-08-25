/**
* IMPORTANT NOTE!
* This file was auto-generated with tsoa.
* Please do not modify it. Re-run tsoa to re-generate this file
*/

import { Router } from "express";
import { container, handleRequest } from "@structured-growth/microservice-sdk";
import * as Controllers from "../controllers/v1";

const handlerOpts = {
    logRequestBody: container.resolve<boolean>('logRequestBody'),
    logResponses: container.resolve<boolean>('logResponses'),
}

export const router = Router();
const pathPrefix = process.env.URI_PATH_PREFIX || '';

//SystemController
router.post(pathPrefix + '/v1/system/migrate', handleRequest(Controllers.SystemController, "migrate", handlerOpts));
router.post(pathPrefix + '/v1/system/i18n-upload', handleRequest(Controllers.SystemController, "uploadI18n", handlerOpts));

//PingController
router.get(pathPrefix + '/v1/ping/alive', handleRequest(Controllers.PingController, "pingGet", handlerOpts));

//MetricController
router.get(pathPrefix + '/v1/metrics', handleRequest(Controllers.MetricController, "search", handlerOpts));
router.get(pathPrefix + '/v1/metrics/aggregate', handleRequest(Controllers.MetricController, "aggregate", handlerOpts));
router.post(pathPrefix + '/v1/metrics', handleRequest(Controllers.MetricController, "create", handlerOpts));
router.get(pathPrefix + '/v1/metrics/:metricId', handleRequest(Controllers.MetricController, "get", handlerOpts));
router.put(pathPrefix + '/v1/metrics/:metricId', handleRequest(Controllers.MetricController, "update", handlerOpts));
router.post(pathPrefix + '/v1/metrics/upsert', handleRequest(Controllers.MetricController, "upsert", handlerOpts));
router.delete(pathPrefix + '/v1/metrics/:metricId', handleRequest(Controllers.MetricController, "delete", handlerOpts));
router.post(pathPrefix + '/v1/metrics/bulk', handleRequest(Controllers.MetricController, "bulk", handlerOpts));
router.post(pathPrefix + '/v1/metrics/statistics', handleRequest(Controllers.MetricController, "generateStatisticsRange", handlerOpts));

//MetricCategoryController
router.get(pathPrefix + '/v1/metric-category', handleRequest(Controllers.MetricCategoryController, "search", handlerOpts));
router.post(pathPrefix + '/v1/metric-category', handleRequest(Controllers.MetricCategoryController, "create", handlerOpts));
router.get(pathPrefix + '/v1/metric-category/:metricCategoryId', handleRequest(Controllers.MetricCategoryController, "get", handlerOpts));
router.put(pathPrefix + '/v1/metric-category/:metricCategoryId', handleRequest(Controllers.MetricCategoryController, "update", handlerOpts));
router.delete(pathPrefix + '/v1/metric-category/:metricCategoryId', handleRequest(Controllers.MetricCategoryController, "delete", handlerOpts));

//MetricTypeController
router.get(pathPrefix + '/v1/metric-type', handleRequest(Controllers.MetricTypeController, "search", handlerOpts));
router.post(pathPrefix + '/v1/metric-type', handleRequest(Controllers.MetricTypeController, "create", handlerOpts));
router.get(pathPrefix + '/v1/metric-type/:metricTypeId', handleRequest(Controllers.MetricTypeController, "get", handlerOpts));
router.put(pathPrefix + '/v1/metric-type/:metricTypeId', handleRequest(Controllers.MetricTypeController, "update", handlerOpts));
router.delete(pathPrefix + '/v1/metric-type/:metricTypeId', handleRequest(Controllers.MetricTypeController, "delete", handlerOpts));

//ReportsController
router.get(pathPrefix + '/v1/reports', handleRequest(Controllers.ReportsController, "search", handlerOpts));
router.post(pathPrefix + '/v1/reports', handleRequest(Controllers.ReportsController, "create", handlerOpts));
router.get(pathPrefix + '/v1/reports/:reportId', handleRequest(Controllers.ReportsController, "get", handlerOpts));
router.put(pathPrefix + '/v1/reports/:reportId', handleRequest(Controllers.ReportsController, "update", handlerOpts));
router.delete(pathPrefix + '/v1/reports/:reportId', handleRequest(Controllers.ReportsController, "delete", handlerOpts));

//ResolverController
router.get(pathPrefix + '/v1/resolver/resolve', handleRequest(Controllers.ResolverController, "resolve", handlerOpts));
router.get(pathPrefix + '/v1/resolver/actions', handleRequest(Controllers.ResolverController, "actions", handlerOpts));
router.get(pathPrefix + '/v1/resolver/models', handleRequest(Controllers.ResolverController, "models", handlerOpts));

// map is required for correct resolving action by route
export const actionToRouteMap = {
	"SystemController.migrate": 'post /v1/system/migrate',
	"SystemController.uploadI18n": 'post /v1/system/i18n-upload',
	"PingController.pingGet": 'get /v1/ping/alive',
	"MetricController.search": 'get /v1/metrics',
	"MetricController.aggregate": 'get /v1/metrics/aggregate',
	"MetricController.create": 'post /v1/metrics',
	"MetricController.get": 'get /v1/metrics/:metricId',
	"MetricController.update": 'put /v1/metrics/:metricId',
	"MetricController.upsert": 'post /v1/metrics/upsert',
	"MetricController.delete": 'delete /v1/metrics/:metricId',
	"MetricController.bulk": 'post /v1/metrics/bulk',
	"MetricController.generateStatisticsRange": 'post /v1/metrics/statistics',
	"MetricCategoryController.search": 'get /v1/metric-category',
	"MetricCategoryController.create": 'post /v1/metric-category',
	"MetricCategoryController.get": 'get /v1/metric-category/:metricCategoryId',
	"MetricCategoryController.update": 'put /v1/metric-category/:metricCategoryId',
	"MetricCategoryController.delete": 'delete /v1/metric-category/:metricCategoryId',
	"MetricTypeController.search": 'get /v1/metric-type',
	"MetricTypeController.create": 'post /v1/metric-type',
	"MetricTypeController.get": 'get /v1/metric-type/:metricTypeId',
	"MetricTypeController.update": 'put /v1/metric-type/:metricTypeId',
	"MetricTypeController.delete": 'delete /v1/metric-type/:metricTypeId',
	"ReportsController.search": 'get /v1/reports',
	"ReportsController.create": 'post /v1/reports',
	"ReportsController.get": 'get /v1/reports/:reportId',
	"ReportsController.update": 'put /v1/reports/:reportId',
	"ReportsController.delete": 'delete /v1/reports/:reportId',
	"ResolverController.resolve": 'get /v1/resolver/resolve',
	"ResolverController.actions": 'get /v1/resolver/actions',
	"ResolverController.models": 'get /v1/resolver/models',
};

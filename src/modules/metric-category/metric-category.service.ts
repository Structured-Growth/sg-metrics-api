import { autoInjectable, inject, NotFoundError, ValidationError } from "@structured-growth/microservice-sdk";
import MetricCategory, { MetricCategoryUpdateAttributes } from "../../../database/models/metric-category.sequelize";
import { MetricCategoryCreateBodyInterface } from "../../interfaces/metric-category-create-body.interface";
import { MetricCategoryUpdateBodyInterface } from "../../interfaces/metric-category-update-body.interface";
import { MetricCategoryRepository } from "./metric-category.repository";
import { isUndefined, omitBy } from "lodash";

@autoInjectable()
export class MetricCategoryService {
    constructor(
        @inject("MetricCategoryRepository") private metricCategoryRepository: MetricCategoryRepository,
    ) {}

    public async create(params: MetricCategoryCreateBodyInterface): Promise<MetricCategory> {

        return this.metricCategoryRepository.create({
            orgId: params.orgId,
            region: params.region,
            title: params.title,
            code: params.code,
            status: params.status || "inactive",
        });
    }

    public async update(metricCategoryId, params: MetricCategoryUpdateBodyInterface): Promise<MetricCategory> {
        const checkMetricCategoryId = await this.metricCategoryRepository.read(metricCategoryId);
        if (!checkMetricCategoryId) {
            throw new NotFoundError(`Metric Category ${metricCategoryId} not found`);
        }
        return this.metricCategoryRepository.update(
            metricCategoryId,
            omitBy(
                {
                    title: params.title,
                    code: params.code,
                    status: params.status,
                },
                isUndefined
            ) as MetricCategoryUpdateAttributes
        );
    }
}

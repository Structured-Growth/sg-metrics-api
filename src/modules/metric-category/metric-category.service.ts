import { autoInjectable, inject, NotFoundError, ValidationError } from "@structured-growth/microservice-sdk";
import MetricCategory, { MetricCategoryUpdateAttributes } from "../../../database/models/metric-category.sequelize";
import MetricCategoryMetadata, {
	MetricCategoryMetadataUpdateAttributes,
} from "../../../database/models/metric-category-metadata.sequelize";
import { MetricCategoryCreateBodyInterface } from "../../interfaces/metric-category-create-body.interface";
import { MetricCategoryUpdateBodyInterface } from "../../interfaces/metric-category-update-body.interface";
import { MetricCategoryRepository } from "./metric-category.repository";
import { isUndefined, omitBy } from "lodash";
import { MetricCategoryMetadataCreateBodyInterface } from "../../interfaces/metric-category-metadata-create-body.interface";

@autoInjectable()
export class MetricCategoryService {
	constructor(
		@inject("MetricCategoryRepository") private metricCategoryRepository: MetricCategoryRepository,
		@inject("MetricCategoryMetadataRepository") private metricCategoryMetadataRepository: MetricCategoryRepository
	) {}

	public async create(params: MetricCategoryCreateBodyInterface): Promise<MetricCategory> {
		const metricCategory = await this.metricCategoryRepository.create({
			orgId: params.orgId,
			region: params.region,
			title: params.title,
			code: params.code,
			status: params.status || "inactive",
			metadata: params.metadata,
		});

		return metricCategory;

		// return await MetricCategory.sequelize.transaction(async (transaction) => {
		//     const metricCategory = await this.metricCategoryRepository.create({
		//         orgId: params.orgId,
		//         region: params.region,
		//         title: params.title,
		//         code: params.code,
		//         status: params.status || "inactive",
		//     }, {
		//         transaction
		//     });
		//
		//     const {name, value} = params.metadata || {name: '', value: ''};
		//
		//     const metadataParams: MetricCategoryMetadataCreateBodyInterface = {
		//         orgId: params.orgId,
		//         accountId: params.accountId || 0,
		//         metricCategoryId: metricCategory.id,
		//         name,
		//         value
		//     };
		//
		//     await this.metricCategoryMetadataRepository.create(metadataParams, {
		//         transaction
		//     });
		//
		//     return metricCategory;
		// });
	}

	public async update(metricCategoryId: any, params: MetricCategoryUpdateBodyInterface): Promise<MetricCategory> {
		// Check if the metric category exists
		const checkMetricCategoryId = await this.metricCategoryRepository.read(metricCategoryId);
		if (!checkMetricCategoryId) {
			throw new NotFoundError(`Metric Category ${metricCategoryId} not found`);
		}

		// Update the metric category
		return this.metricCategoryRepository.update(
			metricCategoryId,
			omitBy(
				{
					title: params.title,
					code: params.code,
					status: params.status,
					metadata: params.metadata,
				},
				isUndefined
			) as MetricCategoryUpdateAttributes
		);
	}
}

import { Op } from "sequelize";
import {
    autoInjectable,
    RepositoryInterface,
    SearchResultInterface,
    NotFoundError,
} from "@structured-growth/microservice-sdk";
import MetricCategoryMetadata, {
    MetricCategoryMetadataCreationAttributes,
    MetricCategoryMetadataUpdateAttributes,
} from "../../../database/models/metric-category-metadata.sequelize";
import { MetricCategoryMetadataSearchParamsInterface } from "../../interfaces/metric-category-metadata-search-params.interface";

@autoInjectable()
export class MetricCategoryMetadataRepository
    implements RepositoryInterface<MetricCategoryMetadata, MetricCategoryMetadataSearchParamsInterface, MetricCategoryMetadataCreationAttributes>
{
    public async search(params: MetricCategoryMetadataSearchParamsInterface): Promise<SearchResultInterface<MetricCategoryMetadata>> {
        const page = params.page || 1;
        const limit = params.limit || 20;
        const offset = (page - 1) * limit;
        const where = {};
        const order = params.sort ? (params.sort.map((item) => item.split(":")) as any) : [["createdAt", "desc"]];

        params.orgId && (where["orgId"] = params.orgId);
        params.metricCategoryId && (where["metricCategoryId"] = params.metricCategoryId);
        params.id && (where["id"] = { [Op.in]: params.id });
        params.value && (where["value"] = { [Op.in]: params.value });

        if (params.name?.length > 0) {
            where["name"] = {
                [Op.or]: params.name.map((str) => ({ [Op.iLike]: str.replace(/\*/g, "%") })),
            };
        }

        // TODO search by arn with wildcards

        const { rows, count } = await MetricCategoryMetadata.findAndCountAll({
            where,
            offset,
            limit,
            order,
        });

        return {
            data: rows,
            total: count,
            limit,
            page,
        };
    }

    public async create(params: MetricCategoryMetadataCreationAttributes): Promise<MetricCategoryMetadata> {
        return MetricCategoryMetadata.create(params);
    }

    public async read(
        id: number,
        params?: {
            attributes?: string[];
        }
    ): Promise<MetricCategoryMetadata | null> {
        return MetricCategoryMetadata.findByPk(id, {
            attributes: params?.attributes,
            rejectOnEmpty: false,
        });
    }

    // pick some attributes
    public async update(id: number, params: MetricCategoryMetadataUpdateAttributes): Promise<MetricCategoryMetadata> {
        const metricCategoryMetadata = await this.read(id);
        metricCategoryMetadata.setAttributes(params);

        return metricCategoryMetadata.save();
    }

    public async delete(id: number): Promise<void> {
        const n = await MetricCategoryMetadata.destroy({ where: { id } });

        if (n === 0) {
            throw new NotFoundError(`Metric Category Metadata ${id} not found`);
        }
    }
}

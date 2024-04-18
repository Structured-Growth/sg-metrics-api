import { Op } from "sequelize";
import {
    autoInjectable,
    RepositoryInterface,
    SearchResultInterface,
    NotFoundError,
} from "@structured-growth/microservice-sdk";
import MetricTypeMetadata, {
    MetricTypeMetadataCreationAttributes,
    MetricTypeMetadataUpdateAttributes,
} from "../../../database/models/metric-type-metadata.sequelize";
import { MetricTypeMetadataSearchParamsInterface } from "../../interfaces/metric-type-metadata-search-params.interface";

@autoInjectable()
export class MetricTypeMetadataRepository
    implements RepositoryInterface<MetricTypeMetadata, MetricTypeMetadataSearchParamsInterface, MetricTypeMetadataCreationAttributes>
{
    public async search(params: MetricTypeMetadataSearchParamsInterface): Promise<SearchResultInterface<MetricTypeMetadata>> {
        const page = params.page || 1;
        const limit = params.limit || 20;
        const offset = (page - 1) * limit;
        const where = {};
        const order = params.sort ? (params.sort.map((item) => item.split(":")) as any) : [["createdAt", "desc"]];

        params.orgId && (where["orgId"] = params.orgId);
        params.metricCategoryId && (where["accountId"] = params.metricCategoryId);
        params.metricTypeId && (where["metricTypeId"] = { [Op.in]: params.metricTypeId });
        params.id && (where["id"] = { [Op.in]: params.id });
        params.value && (where["value"] = { [Op.in]: params.value });

        if (params.name?.length > 0) {
            where["name"] = {
                [Op.or]: params.name.map((str) => ({ [Op.iLike]: str.replace(/\*/g, "%") })),
            };
        }

        // TODO search by arn with wildcards

        const { rows, count } = await MetricTypeMetadata.findAndCountAll({
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

    public async create(params: MetricTypeMetadataCreationAttributes): Promise<MetricTypeMetadata> {
        return MetricTypeMetadata.create(params);
    }

    public async read(
        id: number,
        params?: {
            attributes?: string[];
        }
    ): Promise<MetricTypeMetadata | null> {
        return MetricTypeMetadata.findByPk(id, {
            attributes: params?.attributes,
            rejectOnEmpty: false,
        });
    }

    // pick some attributes
    public async update(id: number, params: MetricTypeMetadataUpdateAttributes): Promise<MetricTypeMetadata> {
        const metricTypeMetadata = await this.read(id);
        metricTypeMetadata.setAttributes(params);

        return metricTypeMetadata.save();
    }

    public async delete(id: number): Promise<void> {
        const n = await MetricTypeMetadata.destroy({ where: { id } });

        if (n === 0) {
            throw new NotFoundError(`Metric Type Metadata ${id} not found`);
        }
    }
}

import { Op } from "sequelize";
import {
    autoInjectable,
    RepositoryInterface,
    SearchResultInterface,
    NotFoundError,
} from "@structured-growth/microservice-sdk";
import MetricType, {
    MetricTypeCreationAttributes,
    MetricTypeUpdateAttributes,
} from "../../../database/models/metric-type.sequelize";
import { MetricTypeSearchParamsInterface } from "../../interfaces/metric-type-search-params.interface";

@autoInjectable()
export class MetricTypeRepository
    implements RepositoryInterface<MetricType, MetricTypeSearchParamsInterface, MetricTypeCreationAttributes>
{
    public async search(params: MetricTypeSearchParamsInterface): Promise<SearchResultInterface<MetricType>> {
        const page = params.page || 1;
        const limit = params.limit || 20;
        const offset = (page - 1) * limit;
        const where = {};
        const order = params.sort ? (params.sort.map((item) => item.split(":")) as any) : [["createdAt", "desc"]];

        params.orgId && (where["orgId"] = params.orgId);
        params.metricCategoryId && (where["accountId"] = params.metricCategoryId);
        params.status && (where["status"] = { [Op.in]: params.status });
        params.id && (where["id"] = { [Op.in]: params.id });
        params.unit && (where["unit"] = { [Op.in]: params.unit });
        params.factor && (where["factor"] = { [Op.in]: params.factor });
        params.relatedTo && (where["relatedTo"] = { [Op.in]: params.relatedTo });
        params.version && (where["version"] = { [Op.in]: params.version });

        if (params.title?.length > 0) {
            where["title"] = {
                [Op.or]: params.title.map((str) => ({ [Op.iLike]: str.replace(/\*/g, "%") })),
            };
        }

        if (params.code?.length > 0) {
            where["code"] = {
                [Op.or]: params.code.map((str) => ({ [Op.iLike]: str.replace(/\*/g, "%") })),
            };
        }

        // TODO search by arn with wildcards

        const { rows, count } = await MetricType.findAndCountAll({
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

    public async create(params: MetricTypeCreationAttributes): Promise<MetricType> {
        return MetricType.create(params);
    }

    public async read(
        id: number,
        params?: {
            attributes?: string[];
        }
    ): Promise<MetricType | null> {
        return MetricType.findByPk(id, {
            attributes: params?.attributes,
            rejectOnEmpty: false,
        });
    }

    // pick some attributes
    public async update(id: number, params: MetricTypeUpdateAttributes): Promise<MetricType> {
        const metricType = await this.read(id);
        metricType.setAttributes(params);

        return metricType.save();
    }

    public async delete(id: number): Promise<void> {
        const n = await MetricType.destroy({ where: { id } });

        if (n === 0) {
            throw new NotFoundError(`Metric Type ${id} not found`);
        }
    }
}

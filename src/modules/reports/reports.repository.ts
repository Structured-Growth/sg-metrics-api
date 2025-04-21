import { Op } from "sequelize";
import {
	autoInjectable,
	RepositoryInterface,
	SearchResultInterface,
	NotFoundError,
	I18nType,
	inject,
} from "@structured-growth/microservice-sdk";
import ReportSequelize, {
	ReportCreationAttributes,
	ReportUpdateAttributes,
} from "../../../database/models/report.sequelize";
import { ReportSearchParamsInterface } from "../../interfaces/report-search-params.interface";

@autoInjectable()
export class ReportsRepository
	implements RepositoryInterface<ReportSequelize, ReportSearchParamsInterface, ReportCreationAttributes>
{
	private i18n: I18nType;
	constructor(@inject("i18n") private getI18n: () => I18nType) {
		this.i18n = this.getI18n();
	}
	public async search(params: ReportSearchParamsInterface): Promise<SearchResultInterface<ReportSequelize>> {
		const page = params.page || 1;
		const limit = params.limit || 20;
		const offset = (page - 1) * limit;
		const where = {};
		const order = params.sort ? (params.sort.map((item) => item.split(":")) as any) : [["createdAt", "desc"]];

		params.orgId && (where["orgId"] = params.orgId);
		params.accountId && (where["accountId"] = params.accountId);
		params.id && (where["id"] = { [Op.in]: params.id });
		params.inDashboard !== undefined && (where["inDashboard"] = params.inDashboard);

		if (params.title?.length > 0) {
			where["title"] = {
				[Op.or]: params.title.map((str) => ({ [Op.iLike]: str.replace(/\*/g, "%") })),
			};
		}

		const { rows, count } = await ReportSequelize.findAndCountAll({
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

	public async create(params: ReportCreationAttributes): Promise<ReportSequelize> {
		return ReportSequelize.create(params);
	}

	public async read(
		id: number,
		params?: {
			attributes?: string[];
		}
	): Promise<ReportSequelize> {
		return ReportSequelize.findByPk(id, {
			attributes: params?.attributes,
			rejectOnEmpty: false,
		});
	}

	public async update(id: number, params: ReportUpdateAttributes): Promise<ReportSequelize> {
		const report = await this.read(id);
		if (!report) {
			throw new NotFoundError(`${this.i18n.__("error.report.name")} ${id} ${this.i18n.__("error.common.not_found")}`);
		}
		report.setAttributes(params);

		return report.save();
	}

	public async delete(id: number): Promise<void> {
		const n = await ReportSequelize.destroy({ where: { id } });

		if (n === 0) {
			throw new NotFoundError(`${this.i18n.__("error.report.name")} ${id} ${this.i18n.__("error.common.not_found")}`);
		}
	}
}

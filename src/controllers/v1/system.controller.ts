import { Post, Route, Hidden } from "@tsoa/runtime";
import { Sequelize } from "sequelize";
import { SequelizeStorage, Umzug } from "umzug";
import * as dbConfig from "../../../database/config/config";
import { BaseController, DescribeAction, injectable } from "@structured-growth/microservice-sdk";
import { Tags } from "tsoa";
import { Options } from "sequelize/types/sequelize";
import { defaultJoiTranslations } from "@structured-growth/microservice-sdk";
import * as mainJson from "../../i18n/locales/en-US.json";

@Route("v1/system")
@Tags("System")
@injectable()
export class SystemController extends BaseController {
	/**
	 * Apply last migrations
	 */
	@Post("migrate")
	@DescribeAction("system/migrate")
	@Hidden()
	public async migrate(): Promise<void> {
		this.logger.info("Applying latest migrations...");
		const config = await dbConfig();
		const sequelize = new Sequelize(config as Options);

		try {
			await sequelize.createSchema(process.env.DB_MIGRATION_TABLE_SCHEMA, {});
			await sequelize.createSchema(process.env.DB_SCHEMA, {});
		} catch (e) {
			if (e.message.includes("already exists")) {
				this.logger.info("Schema already exists, continue...");
			} else {
				throw e;
			}
		}

		const umzug = new Umzug({
			migrations: {
				glob: "database/migrations/*.js",
				resolve: ({ name, path, context }) => {
					const migration = require(`../../../database/migrations/${name}`);
					return {
						name,
						up: async () => migration.up(context),
						down: async () => migration.down(context),
					};
				},
			},
			context: sequelize.getQueryInterface(),
			storage: new SequelizeStorage({
				sequelize,
				schema: process.env.DB_MIGRATION_TABLE_SCHEMA,
				tableName: process.env.DB_MIGRATION_TABLE_NAME,
			}),
			logger: console as any,
		});

		const result = await umzug.up();

		this.logger.info(`${result.length} migrations applied.`, result);
	}

	@Post("i18n-upload")
	@DescribeAction("system/i18n-upload")
	@Hidden()
	public async uploadI18n(): Promise<void> {
		const merged = { ...mainJson, ...defaultJoiTranslations };

		const payload = {
			locale: process.env.DEFAULT_LANGUAGE || "en-US",
			data: merged,
		};

		const url = `${process.env.TRANSLATE_API_URL}/v1/translation-set/${process.env.TRANSLATE_API_CLIENT_ID}/upload`;
		const resp = await fetch(url, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(payload),
		});

		if (resp.status !== 204) {
			throw new Error(`Translate API responded with ${resp.status}: ${await resp.text()}`);
		}
	}
}

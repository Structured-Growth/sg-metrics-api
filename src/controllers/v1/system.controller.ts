import { injectable } from "tsyringe";
import { Post, Route, Hidden } from "@tsoa/runtime";
import { Sequelize } from "sequelize";
import { SequelizeStorage, Umzug } from "umzug";
import * as dbConfig from "../../../database/config/config";
import { BaseController } from "@structured-growth/microservice-sdk";
import { Tags } from "tsoa";
import { Options } from "sequelize/types/sequelize";

@Route("v1/system")
@Tags("SystemController")
@injectable()
export class SystemController extends BaseController {
	/**
	 * Apply last migrations
	 */
	@Post("migrate")
	@Hidden()
	public async migrate(): Promise<void> {
		this.logger.info("Applying latest migrations...");
		const config = await dbConfig();
		const sequelize = new Sequelize(config as Options);
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
}

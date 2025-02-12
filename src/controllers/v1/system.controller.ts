import { Post, Route, Hidden } from "@tsoa/runtime";
import { Sequelize } from "sequelize";
import { SequelizeStorage, Umzug } from "umzug";
import * as dbConfig from "../../../database/config/config";
import { BaseController, DescribeAction, injectable } from "@structured-growth/microservice-sdk";
import { Tags } from "tsoa";
import { Options } from "sequelize/types/sequelize";

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
}

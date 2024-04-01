const { config } = require("dotenv");

config();

/**
 * Sequelize config
 */
module.exports = async () => {
	process.env.dbSchema = process.env.DB_SCHEMA || "public";

	return {
		host: process.env.DB_HOST,
		port: Number(process.env.DB_PORT),
		username: process.env.DB_USERNAME,
		password: process.env.DB_PASSWORD,
		database: process.env.DB_DATABASE,
		dialect: "postgres",
		migrationStorageTableSchema: process.env.DB_MIGRATION_TABLE_SCHEMA,
		migrationStorageTableName: process.env.DB_MIGRATION_TABLE_NAME,
	};
};

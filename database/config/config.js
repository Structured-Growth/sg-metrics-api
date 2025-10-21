const { config } = require("dotenv");

config();

/**
 * Sequelize config
 */
module.exports = async () => {
	process.env.DB_SCHEMA = process.env.DB_SCHEMA || "public";

	return {
		host: process.env.DB_HOST,
		port: Number(process.env.DB_PORT),
		username: process.env.DB_USERNAME,
		password: process.env.DB_PASSWORD,
		database: process.env.DB_DATABASE,
		schema: process.env.DB_SCHEMA,
		dialect: "postgres",
		pool: {
			max: Number(process.env.DB_POOL_MAX ?? 5),
			min: Number(process.env.DB_POOL_MIN ?? 0),
			acquire: Number(process.env.DB_POOL_ACQUIRE ?? 10000),
			idle: Number(process.env.DB_POOL_IDLE ?? 10000),
			evict: Number(process.env.DB_POOL_EVICT ?? 10000),
			maxUses: Number(process.env.DB_POOL_MAX_USES ?? 0),
		},
		benchmark: true,
		logging: false,
		migrationStorageTableSchema: process.env.DB_MIGRATION_TABLE_SCHEMA,
		migrationStorageTableName: process.env.DB_MIGRATION_TABLE_NAME,
	};
};

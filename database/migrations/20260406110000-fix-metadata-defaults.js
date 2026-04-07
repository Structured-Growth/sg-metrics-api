"use strict";

const Sequelize = require("sequelize");

/** @type {import("sequelize-cli").Migration} */
module.exports = {
	async up(queryInterface) {
		await queryInterface.sequelize.query(
			`UPDATE "${process.env.DB_SCHEMA}"."metrics" SET "metadata" = '{}'::jsonb WHERE "metadata" IS NULL;`
		);

		await queryInterface.changeColumn(
			{
				schema: process.env.DB_SCHEMA,
				tableName: "metrics",
			},
			"metadata",
			{
				type: Sequelize.JSONB,
				allowNull: false,
				defaultValue: {},
			}
		);
	},

	async down(queryInterface) {
		await queryInterface.changeColumn(
			{
				schema: process.env.DB_SCHEMA,
				tableName: "metrics",
			},
			"metadata",
			{
				type: Sequelize.JSONB,
				allowNull: true,
				defaultValue: null,
			}
		);
	},
};

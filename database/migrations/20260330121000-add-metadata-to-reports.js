"use strict";

const Sequelize = require("sequelize");

/** @type {import("sequelize-cli").Migration} */
module.exports = {
	async up(queryInterface) {
		await queryInterface.addColumn(
			{
				schema: process.env.DB_SCHEMA,
				tableName: "reports",
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
		await queryInterface.removeColumn(
			{
				schema: process.env.DB_SCHEMA,
				tableName: "reports",
			},
			"metadata"
		);
	},
};

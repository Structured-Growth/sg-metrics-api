"use strict";

const Sequelize = require("sequelize");

/** @type {import("sequelize-cli").Migration} */
module.exports = {
	async up(queryInterface) {
		await queryInterface.changeColumn(
			{
				schema: process.env.DB_SCHEMA,
				tableName: "metric_types",
			},
			"factor",
			Sequelize.FLOAT
		);
	},

	async down(queryInterface) {
		await queryInterface.changeColumn(
			{
				schema: process.env.DB_SCHEMA,
				tableName: "metric_types",
			},
			"factor",
			Sequelize.SMALLINT
		);
	},
};

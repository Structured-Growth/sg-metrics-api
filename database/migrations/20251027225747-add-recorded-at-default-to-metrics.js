"use strict";

const Sequelize = require("sequelize");

/** @type {import("sequelize-cli").Migration} */
module.exports = {
	async up(queryInterface) {
		const table = { schema: process.env.DB_SCHEMA, tableName: "metrics" };

		await queryInterface.changeColumn(table, "recorded_at", {
			type: Sequelize.DATE,
			allowNull: true,
			defaultValue: Sequelize.fn("now"),
		});
	},

	async down(queryInterface) {
		const table = { schema: process.env.DB_SCHEMA, tableName: "metrics" };

		await queryInterface.changeColumn(table, "recorded_at", {
			type: Sequelize.DATE,
			allowNull: true,
			defaultValue: null,
		});
	},
};

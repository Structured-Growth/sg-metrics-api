"use strict";

const Sequelize = require("sequelize");

/** @type {import("sequelize-cli").Migration} */
module.exports = {
	async up(queryInterface) {
		await queryInterface.changeColumn("reports", "report_parameters", {
			type: Sequelize.TEXT,
			allowNull: false,
		});
	},

	async down(queryInterface) {
		await queryInterface.changeColumn("reports", "report_parameters", {
			type: Sequelize.STRING(500),
			allowNull: false,
		});
	},
};

"use strict";

const Sequelize = require("sequelize");

/** @type {import("sequelize-cli").Migration} */
module.exports = {
	async up(queryInterface) {
		await queryInterface.createTable("metric_categories", {
			id: {
				type: Sequelize.SMALLINT,
				primaryKey: true,
				autoIncrement: true,
			},
			org_id: {
				type: Sequelize.INTEGER,
				allowNull: false,
			},
			account_id: {
				type: Sequelize.INTEGER,
			},
			region: {
				type: Sequelize.STRING(10),
				allowNull: false,
			},
			title: {
				type: Sequelize.STRING(100),
				allowNull: false,
			},
			code: {
				type: Sequelize.STRING(100),
				unique: true,
			},
			status: {
				type: Sequelize.STRING(15),
				allowNull: false,
			},
			created_at: Sequelize.DATE,
			updated_at: Sequelize.DATE,
			deleted_at: Sequelize.DATE,
		});
	},

	async down(queryInterface) {
		await queryInterface.dropTable("metric_categories");
	},
};

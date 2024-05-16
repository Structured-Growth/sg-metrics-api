"use strict";

const Sequelize = require("sequelize");

/** @type {import("sequelize-cli").Migration} */
module.exports = {
	async up(queryInterface) {
		await queryInterface.createTable("metric_categories_metadata", {
			id: {
				type: Sequelize.SMALLINT,
				primaryKey: true,
				autoIncrement: true,
			},
			org_id: {
				type: Sequelize.INTEGER,
			},
			account_id: {
				type: Sequelize.INTEGER,
			},
			region: {
				type: Sequelize.STRING(10),
				allowNull: false,
			},
			metric_category_id: {
				type: Sequelize.SMALLINT,
				references: {
					model: "metric_categories",
					key: "id",
				},
				onDelete: "CASCADE",
			},
			name: {
				type: Sequelize.STRING(100),
				allowNull: false,
			},
			value: {
				type: Sequelize.STRING(255),
			},
			created_at: Sequelize.DATE,
			updated_at: Sequelize.DATE,
			deleted_at: Sequelize.DATE,
		});
	},

	async down(queryInterface) {
		await queryInterface.dropTable("metric_categories_metadata");
	},
};

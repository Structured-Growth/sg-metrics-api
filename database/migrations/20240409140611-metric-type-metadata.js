"use strict";

const Sequelize = require("sequelize");

/** @type {import("sequelize-cli").Migration} */
module.exports = {
	async up(queryInterface) {
		await queryInterface.createTable(
			{
				schema: process.env.DB_SCHEMA,
				tableName: "metric_types_metadata",
			},
			{
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
				metric_category_id: {
					type: Sequelize.SMALLINT,
					references: {
						model: "metric_categories",
						key: "id",
					},
					onDelete: "RESTRICT",
				},
				metric_type_id: {
					type: Sequelize.SMALLINT,
					references: {
						model: "metric_types",
						key: "id",
					},
					onDelete: "RESTRICT",
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
			}
		);
	},

	async down(queryInterface) {
		await queryInterface.dropTable({
			schema: process.env.DB_SCHEMA,
			tableName: "metric_types_metadata",
		});
	},
};

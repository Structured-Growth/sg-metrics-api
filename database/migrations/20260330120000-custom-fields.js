"use strict";

const Sequelize = require("sequelize");

/** @type {import("sequelize-cli").Migration} */
module.exports = {
	async up(queryInterface) {
		await queryInterface.createTable(
			{
				schema: process.env.DB_SCHEMA,
				tableName: "custom_fields",
			},
			{
				id: {
					type: Sequelize.INTEGER,
					primaryKey: true,
					autoIncrement: true,
				},
				org_id: {
					type: Sequelize.INTEGER,
					allowNull: false,
				},
				region: {
					type: Sequelize.STRING(10),
					allowNull: false,
				},
				entity: {
					type: Sequelize.STRING(255),
					allowNull: false,
				},
				title: {
					type: Sequelize.STRING(255),
					allowNull: false,
				},
				name: {
					type: Sequelize.STRING(255),
					allowNull: false,
				},
				schema: {
					type: Sequelize.JSONB,
					allowNull: false,
				},
				status: {
					type: Sequelize.STRING(15),
					allowNull: false,
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
			tableName: "custom_fields",
		});
	},
};

"use strict";

const Sequelize = require("sequelize");

/** @type {import("sequelize-cli").Migration} */
module.exports = {
	async up(queryInterface) {
		await queryInterface.createTable("metrics_aurora", {
			id: {
				type: Sequelize.STRING,
				allowNull: false,
				primaryKey: true,
			},
			org_id: {
				type: Sequelize.INTEGER,
				allowNull: false,
			},
			region: {
				type: Sequelize.STRING(10),
				allowNull: false,
			},
			account_id: {
				type: Sequelize.INTEGER,
				allowNull: true,
			},
			user_id: {
				type: Sequelize.INTEGER,
				allowNull: false,
			},
			related_to_rn: {
				type: Sequelize.STRING,
				allowNull: true,
			},
			metric_category_id: {
				type: Sequelize.SMALLINT,
				allowNull: false,
				references: {
					model: "metric_categories",
					key: "id",
				},
				onDelete: "RESTRICT",
			},
			metric_type_id: {
				type: Sequelize.SMALLINT,
				allowNull: false,
				references: {
					model: "metric_types",
					key: "id",
				},
				onDelete: "RESTRICT",
			},
			metric_type_version: {
				type: Sequelize.INTEGER,
				allowNull: false,
			},
			device_id: {
				type: Sequelize.INTEGER,
				allowNull: false,
			},
			batch_id: {
				type: Sequelize.STRING,
				allowNull: false,
			},
			value: {
				type: Sequelize.FLOAT,
				allowNull: false,
			},
			taken_at: {
				type: Sequelize.DATE,
				allowNull: false,
			},
			taken_at_offset: {
				type: Sequelize.INTEGER,
				allowNull: false,
			},
			recorded_at: {
				type: Sequelize.DATE,
				allowNull: false,
				defaultValue: Sequelize.NOW,
			},
			is_deleted: {
				type: Sequelize.BOOLEAN,
				allowNull: false,
				defaultValue: false,
			},
			created_at: Sequelize.DATE,
			updated_at: Sequelize.DATE,
		});
	},

	async down(queryInterface) {
		await queryInterface.dropTable("metrics_aurora");
	},
};

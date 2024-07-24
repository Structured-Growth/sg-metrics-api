"use strict";

const Sequelize = require("sequelize");

/** @type {import("sequelize-cli").Migration} */
module.exports = {
	async up(queryInterface) {
		await queryInterface.createTable("metrics", {
			id: {
				type: Sequelize.STRING,
				primaryKey: true,
			},
			org_id: {
				type: Sequelize.INTEGER,
			},
			region: {
				type: Sequelize.STRING(10),
			},
			account_id: {
				type: Sequelize.INTEGER,
			},
			user_id: {
				type: Sequelize.INTEGER,
			},
			related_to_rn: {
				type: Sequelize.STRING,
			},
			metric_category_id: {
				type: Sequelize.SMALLINT,
			},
			metric_type_id: {
				type: Sequelize.SMALLINT,
			},
			metric_type_version: {
				type: Sequelize.INTEGER,
			},
			device_id: {
				type: Sequelize.INTEGER,
			},
			batch_id: {
				type: Sequelize.STRING,
			},
			value: {
				type: Sequelize.FLOAT,
			},
			taken_at: {
				type: Sequelize.DATE,
			},
			taken_at_offset: {
				type: Sequelize.INTEGER,
			},
			recorded_at: {
				type: Sequelize.DATE,
			},
			is_deleted: {
				type: Sequelize.BOOLEAN,
			},
		});
	},

	async down(queryInterface) {
		await queryInterface.dropTable("metrics");
	},
};

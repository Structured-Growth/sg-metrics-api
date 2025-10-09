"use strict";

const Sequelize = require("sequelize");

/** @type {import("sequelize-cli").Migration} */
module.exports = {
	async up(queryInterface) {
		const table = { schema: process.env.DB_SCHEMA, tableName: "metrics" };

		await queryInterface.removeIndex(table, "metrics_org_id");
		await queryInterface.removeIndex(table, "metrics_account_id");
		await queryInterface.removeIndex(table, "metrics_metric_type_id");
		await queryInterface.removeIndex(table, "metrics_related_to_rn");
		await queryInterface.removeIndex(table, "metrics_device_id");

		await queryInterface.addIndex(table, ["taken_at"], {
			name: "metrics_taken_at",
		});
	},

	async down(queryInterface) {
		const table = { schema: process.env.DB_SCHEMA, tableName: "metrics" };

		await queryInterface.removeIndex(table, "metrics_taken_at");

		await queryInterface.addIndex(table, ["org_id"], { name: "metrics_org_id" });
		await queryInterface.addIndex(table, ["account_id"], { name: "metrics_account_id" });
		await queryInterface.addIndex(table, ["metric_type_id"], { name: "metrics_metric_type_id" });
		await queryInterface.addIndex(table, ["related_to_rn"], { name: "metrics_related_to_rn" });
		await queryInterface.addIndex(table, ["device_id"], { name: "metrics_device_id" });
	},
};

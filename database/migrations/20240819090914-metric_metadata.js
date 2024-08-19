"use strict";

const Sequelize = require("sequelize");

/** @type {import("sequelize-cli").Migration} */
module.exports = {
	async up(queryInterface) {
		await queryInterface.addColumn("metrics", "metadata", Sequelize.JSONB);
		await queryInterface.addIndex("metrics", ["org_id"]);
		await queryInterface.addIndex("metrics", ["account_id"]);
		await queryInterface.addIndex("metrics", ["user_id"]);
		await queryInterface.addIndex("metrics", ["metric_type_id"]);
		await queryInterface.addIndex("metrics", ["related_to_rn"]);
		await queryInterface.addIndex("metrics", ["device_id"]);
	},

	async down(queryInterface) {
		await queryInterface.removeColumn("metrics", "metadata");
		await queryInterface.removeIndex("metrics", "metrics_org_id");
		await queryInterface.removeIndex("metrics", "metrics_account_id");
		await queryInterface.removeIndex("metrics", "metrics_user_id");
		await queryInterface.removeIndex("metrics", "metrics_metric_type_id");
		await queryInterface.removeIndex("metrics", "metrics_related_to_rn");
		await queryInterface.removeIndex("metrics", "metrics_device_id");
	},
};

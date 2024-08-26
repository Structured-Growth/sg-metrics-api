"use strict";

const Sequelize = require("sequelize");

/** @type {import("sequelize-cli").Migration} */
module.exports = {
	async up(queryInterface) {
		await queryInterface.addColumn(
			{
				schema: process.env.DB_SCHEMA,
				tableName: "metrics",
			},
			"metadata",
			Sequelize.JSONB
		);
		await queryInterface.addIndex(
			{
				schema: process.env.DB_SCHEMA,
				tableName: "metrics",
			},
			["org_id"]
		);
		await queryInterface.addIndex(
			{
				schema: process.env.DB_SCHEMA,
				tableName: "metrics",
			},
			["account_id"]
		);
		await queryInterface.addIndex(
			{
				schema: process.env.DB_SCHEMA,
				tableName: "metrics",
			},
			["user_id"]
		);
		await queryInterface.addIndex(
			{
				schema: process.env.DB_SCHEMA,
				tableName: "metrics",
			},
			["metric_type_id"]
		);
		await queryInterface.addIndex(
			{
				schema: process.env.DB_SCHEMA,
				tableName: "metrics",
			},
			["related_to_rn"]
		);
		await queryInterface.addIndex(
			{
				schema: process.env.DB_SCHEMA,
				tableName: "metrics",
			},
			["device_id"]
		);
	},

	async down(queryInterface) {
		await queryInterface.removeColumn(
			{
				schema: process.env.DB_SCHEMA,
				tableName: "metrics",
			},
			"metadata"
		);
		await queryInterface.removeIndex(
			{
				schema: process.env.DB_SCHEMA,
				tableName: "metrics",
			},
			"metrics_org_id"
		);
		await queryInterface.removeIndex(
			{
				schema: process.env.DB_SCHEMA,
				tableName: "metrics",
			},
			"metrics_account_id"
		);
		await queryInterface.removeIndex(
			{
				schema: process.env.DB_SCHEMA,
				tableName: "metrics",
			},
			"metrics_user_id"
		);
		await queryInterface.removeIndex(
			{
				schema: process.env.DB_SCHEMA,
				tableName: "metrics",
			},
			"metrics_metric_type_id"
		);
		await queryInterface.removeIndex(
			{
				schema: process.env.DB_SCHEMA,
				tableName: "metrics",
			},
			"metrics_related_to_rn"
		);
		await queryInterface.removeIndex(
			{
				schema: process.env.DB_SCHEMA,
				tableName: "metrics",
			},
			"metrics_device_id"
		);
	},
};

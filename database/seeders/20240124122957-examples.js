"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.bulkInsert(
			"example",
			Array(10)
				.fill(null)
				.map((i, index) => ({
					account_id: index + 1,
					org_id: index + 1,
					region: "us",
					status: "active",
					created_at: new Date(),
				})),
			{}
		);
	},

	async down(queryInterface, Sequelize) {
		await queryInterface.bulkDelete("example", null, {});
	},
};

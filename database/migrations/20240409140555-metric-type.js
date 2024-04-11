'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("metric_types", {
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
      metricCategoryId: {
        type: Sequelize.SMALLINT,
        references: {
          model: "metric_categories",
          key: "id",
        },
        onDelete: "RESTRICT",
      },
      title: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      code: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
      },
      unit: {
        type: Sequelize.STRING(15),
      },
      factor: {
        type: Sequelize.SMALLINT,
      },
      relatedTo: {
        type: Sequelize.STRING(50),
      },
      version: {
        type: Sequelize.SMALLINT,
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

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("metric_types");
  },
};

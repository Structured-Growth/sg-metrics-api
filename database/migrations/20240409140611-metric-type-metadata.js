'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("metric_types_metadata", {
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
      metricTypeId: {
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
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("metric_types_metadata");
  },
};

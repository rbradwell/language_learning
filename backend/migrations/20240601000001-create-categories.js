'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Categories', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT
      },
      language: {
        type: Sequelize.ENUM('Mandarin', 'Portuguese'),
        allowNull: false
      },
      difficulty: {
        type: Sequelize.INTEGER,
        defaultValue: 1
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    await queryInterface.addIndex('Categories', ['language']);
    await queryInterface.addIndex('Categories', ['difficulty']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Categories');
  }
};

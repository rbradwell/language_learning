// backend/migrations/20240601000004-create-trail-steps.js
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('TrailSteps', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4
      },
      trailId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Trails',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      type: {
        type: Sequelize.ENUM('vocabulary_matching', 'sentence_completion', 'fill_blanks'),
        allowNull: false
      },
      stepNumber: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      passingScore: {
        type: Sequelize.INTEGER,
        defaultValue: 70
      },
      timeLimit: {
        type: Sequelize.INTEGER,
        defaultValue: 300
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

    await queryInterface.addIndex('TrailSteps', ['trailId']);
    await queryInterface.addIndex('TrailSteps', ['stepNumber']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('TrailSteps');
  }
};

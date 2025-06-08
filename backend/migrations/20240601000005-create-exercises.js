// migrations/20240601000002-create-exercise.js
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Exercises', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4
      },
      trailStepId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'TrailSteps',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      type: {
        type: Sequelize.ENUM('vocabulary_matching', 'sentence_completion', 'fill_blanks'),
        allowNull: false
      },
      content: {
        type: Sequelize.JSON,
        allowNull: false,
        comment: 'Stores exercise data as JSON (sentences, options, etc.)'
      },
      order: {
        type: Sequelize.INTEGER,
        allowNull: false,
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

    await queryInterface.addIndex('Exercises', ['trailStepId']);
    await queryInterface.addIndex('Exercises', ['type']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Exercises');
  }
};
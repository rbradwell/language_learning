// migrations/20240608000005-update-user-answer-constraints.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Make exerciseId NOT NULL
    await queryInterface.changeColumn('UserAnswers', 'exerciseId', {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: 'Exercises',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });

    // Add questionData column for non-vocabulary exercises
    await queryInterface.addColumn('UserAnswers', 'questionData', {
      type: Sequelize.JSON,
      allowNull: true,
      comment: 'Additional question context for non-vocabulary exercises'
    });

    // Add indexes for better query performance (only exerciseId, others already exist)
    await queryInterface.addIndex('UserAnswers', ['exerciseId']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex('UserAnswers', ['exerciseId']);
    await queryInterface.removeColumn('UserAnswers', 'questionData');
    
    // Revert exerciseId to nullable
    await queryInterface.changeColumn('UserAnswers', 'exerciseId', {
      type: Sequelize.UUID,
      allowNull: true
    });
  }
};
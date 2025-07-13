'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Drop the UserAnswers table
    await queryInterface.dropTable('UserAnswers');
    console.log('Dropped UserAnswers table');
  },

  down: async (queryInterface, Sequelize) => {
    // Recreate UserAnswers table if needed to rollback
    await queryInterface.createTable('UserAnswers', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      sessionId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'ExerciseSessions',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      exerciseId: {
        type: Sequelize.UUID,
        allowNull: false,
        comment: 'All answers must reference an exercise'
      },
      vocabularyId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'Vocabularies',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      userAnswer: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      isCorrect: {
        type: Sequelize.BOOLEAN,
        allowNull: false
      },
      timeSpent: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Time spent on this answer in seconds'
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Add indexes
    await queryInterface.addIndex('UserAnswers', ['sessionId']);
    await queryInterface.addIndex('UserAnswers', ['exerciseId']);
    await queryInterface.addIndex('UserAnswers', ['vocabularyId']);

    console.log('Recreated UserAnswers table for rollback');
  }
};
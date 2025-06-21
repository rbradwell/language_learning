// migrations/20240608000002-create-exercise-sessions.js
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ExerciseSessions', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
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
      totalQuestions: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      score: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      status: {
        type: Sequelize.ENUM('in_progress', 'completed', 'abandoned'),
        defaultValue: 'in_progress'
      },
      completedAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      expiresAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("(NOW() + INTERVAL '24 hours')")
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

    // Add indexes for performance
    await queryInterface.addIndex('ExerciseSessions', ['userId']);
    await queryInterface.addIndex('ExerciseSessions', ['trailStepId']);
    await queryInterface.addIndex('ExerciseSessions', ['status']);
    await queryInterface.addIndex('ExerciseSessions', ['expiresAt']);
    
    // Composite index for finding active sessions
    await queryInterface.addIndex('ExerciseSessions', ['userId', 'trailStepId', 'status']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('ExerciseSessions');
  }
};
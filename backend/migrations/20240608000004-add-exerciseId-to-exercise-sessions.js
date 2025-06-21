// migrations/20240608000004-add-exerciseId-to-exercise-sessions.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('ExerciseSessions', 'exerciseId', {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: 'Exercises',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });

    // Add index for better query performance
    await queryInterface.addIndex('ExerciseSessions', ['exerciseId']);
    
    // Add unique constraint to prevent multiple sessions per exercise per user
    await queryInterface.addIndex('ExerciseSessions', ['userId', 'exerciseId'], {
      unique: true,
      name: 'unique_user_exercise_session'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex('ExerciseSessions', 'unique_user_exercise_session');
    await queryInterface.removeIndex('ExerciseSessions', ['exerciseId']);
    await queryInterface.removeColumn('ExerciseSessions', 'exerciseId');
  }
};
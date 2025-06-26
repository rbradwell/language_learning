// migrations/20250622224500-remove-unique-exercise-session-constraint.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Remove the problematic unique constraint that prevents multiple sessions per exercise
    await queryInterface.removeIndex('ExerciseSessions', 'unique_user_exercise_session');
  },

  down: async (queryInterface, Sequelize) => {
    // Add the constraint back if needed (though it was problematic)
    await queryInterface.addIndex('ExerciseSessions', ['userId', 'exerciseId'], {
      unique: true,
      name: 'unique_user_exercise_session'
    });
  }
};
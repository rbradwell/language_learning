'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Drop the foreign key constraint on exerciseId
    await queryInterface.removeConstraint('ExerciseSessions', 'ExerciseSessions_exerciseId_fkey');
    console.log('Removed foreign key constraint from ExerciseSessions.exerciseId');
  },

  down: async (queryInterface, Sequelize) => {
    // Re-add the foreign key constraint (pointing back to Exercises table)
    await queryInterface.addConstraint('ExerciseSessions', {
      fields: ['exerciseId'],
      type: 'foreign key',
      name: 'ExerciseSessions_exerciseId_fkey',
      references: {
        table: 'Exercises',
        field: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });
    console.log('Restored foreign key constraint on ExerciseSessions.exerciseId');
  }
};
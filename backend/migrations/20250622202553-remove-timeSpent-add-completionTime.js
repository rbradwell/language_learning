'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // No-op: The tables already have the correct structure
    // UserProgresses already has completionTime and never had timeSpent
    // UserAnswers never had timeSpent
    console.log('Migration skipped - tables already in correct state');
  },

  async down (queryInterface, Sequelize) {
    // No-op: Nothing to revert since no changes were made
    console.log('Migration rollback skipped - no changes to revert');
  }
};

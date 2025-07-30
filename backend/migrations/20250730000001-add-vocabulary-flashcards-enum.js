'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      console.log('Adding vocabulary_flashcards to TrailStep type ENUM...');
      
      // Add the new enum value
      await queryInterface.sequelize.query(`
        ALTER TYPE "enum_TrailSteps_type" ADD VALUE 'vocabulary_flashcards';
      `);
      
      console.log('TrailStep type ENUM updated successfully!');
    } catch (error) {
      // Check if the error is because the value already exists
      if (error.message && error.message.includes('already exists')) {
        console.log('ENUM value already exists, skipping...');
        return;
      }
      console.error('Error updating TrailStep ENUM:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    console.log('Note: PostgreSQL does not support removing enum values directly.');
    console.log('The vocabulary_flashcards value will remain in the enum.');
  }
};
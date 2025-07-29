'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      console.log('Updating TrailStep type ENUM to include vocabulary_matching_reverse...');
      
      // Add the new enum value
      await queryInterface.sequelize.query(`
        ALTER TYPE "enum_TrailSteps_type" ADD VALUE 'vocabulary_matching_reverse';
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
    try {
      console.log('Reverting TrailStep type ENUM...');
      
      // Note: PostgreSQL doesn't support removing enum values directly
      // This would require recreating the enum type, which is complex
      // For now, we'll leave the enum value (it won't hurt anything)
      console.log('Note: PostgreSQL does not support removing enum values directly.');
      console.log('The vocabulary_matching_reverse value will remain in the enum.');
      
    } catch (error) {
      console.error('Error reverting TrailStep ENUM:', error);
      throw error;
    }
  }
};
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Remove vocabulary_matching from the Exercise type enum since it now has its own table
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_Exercises_type" 
      RENAME TO "enum_Exercises_type_old"
    `);
    
    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_Exercises_type" AS ENUM('sentence_completion', 'fill_blanks')
    `);
    
    await queryInterface.sequelize.query(`
      ALTER TABLE "Exercises" 
      ALTER COLUMN type TYPE "enum_Exercises_type" 
      USING type::text::"enum_Exercises_type"
    `);
    
    await queryInterface.sequelize.query(`
      DROP TYPE "enum_Exercises_type_old"
    `);

    console.log('Updated Exercise type enum to remove vocabulary_matching');
  },

  down: async (queryInterface, Sequelize) => {
    // Add vocabulary_matching back to the Exercise type enum
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_Exercises_type" 
      RENAME TO "enum_Exercises_type_old"
    `);
    
    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_Exercises_type" AS ENUM('vocabulary_matching', 'sentence_completion', 'fill_blanks')
    `);
    
    await queryInterface.sequelize.query(`
      ALTER TABLE "Exercises" 
      ALTER COLUMN type TYPE "enum_Exercises_type" 
      USING type::text::"enum_Exercises_type"
    `);
    
    await queryInterface.sequelize.query(`
      DROP TYPE "enum_Exercises_type_old"
    `);

    console.log('Restored vocabulary_matching to Exercise type enum');
  }
};
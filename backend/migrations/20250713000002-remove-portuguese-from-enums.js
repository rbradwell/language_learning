'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      console.log('Removing Portuguese from ENUM types...');
      
      // Update the language ENUM in Categories table to only include Mandarin
      await queryInterface.sequelize.query(`
        ALTER TYPE "enum_Categories_language" RENAME TO "enum_Categories_language_old";
      `, { transaction });
      
      await queryInterface.sequelize.query(`
        CREATE TYPE "enum_Categories_language" AS ENUM ('Mandarin');
      `, { transaction });
      
      await queryInterface.sequelize.query(`
        ALTER TABLE "Categories" 
        ALTER COLUMN "language" TYPE "enum_Categories_language" 
        USING "language"::text::"enum_Categories_language";
      `, { transaction });
      
      await queryInterface.sequelize.query(`
        DROP TYPE "enum_Categories_language_old";
      `, { transaction });
      
      // Update the targetLanguage ENUM in Users table to only include Mandarin
      await queryInterface.sequelize.query(`
        ALTER TYPE "enum_Users_targetLanguage" RENAME TO "enum_Users_targetLanguage_old";
      `, { transaction });
      
      await queryInterface.sequelize.query(`
        CREATE TYPE "enum_Users_targetLanguage" AS ENUM ('Mandarin');
      `, { transaction });
      
      await queryInterface.sequelize.query(`
        ALTER TABLE "Users" 
        ALTER COLUMN "targetLanguage" TYPE "enum_Users_targetLanguage" 
        USING "targetLanguage"::text::"enum_Users_targetLanguage";
      `, { transaction });
      
      await queryInterface.sequelize.query(`
        DROP TYPE "enum_Users_targetLanguage_old";
      `, { transaction });
      
      await transaction.commit();
      console.log('Successfully removed Portuguese from ENUM types');
      
    } catch (error) {
      await transaction.rollback();
      console.error('Error updating ENUM types:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      console.log('Restoring Portuguese to ENUM types...');
      
      // Restore Categories language ENUM
      await queryInterface.sequelize.query(`
        ALTER TYPE "enum_Categories_language" RENAME TO "enum_Categories_language_old";
      `, { transaction });
      
      await queryInterface.sequelize.query(`
        CREATE TYPE "enum_Categories_language" AS ENUM ('Mandarin', 'Portuguese');
      `, { transaction });
      
      await queryInterface.sequelize.query(`
        ALTER TABLE "Categories" 
        ALTER COLUMN "language" TYPE "enum_Categories_language" 
        USING "language"::text::"enum_Categories_language";
      `, { transaction });
      
      await queryInterface.sequelize.query(`
        DROP TYPE "enum_Categories_language_old";
      `, { transaction });
      
      // Restore Users targetLanguage ENUM
      await queryInterface.sequelize.query(`
        ALTER TYPE "enum_Users_targetLanguage" RENAME TO "enum_Users_targetLanguage_old";
      `, { transaction });
      
      await queryInterface.sequelize.query(`
        CREATE TYPE "enum_Users_targetLanguage" AS ENUM ('Mandarin', 'Portuguese');
      `, { transaction });
      
      await queryInterface.sequelize.query(`
        ALTER TABLE "Users" 
        ALTER COLUMN "targetLanguage" TYPE "enum_Users_targetLanguage" 
        USING "targetLanguage"::text::"enum_Users_targetLanguage";
      `, { transaction });
      
      await queryInterface.sequelize.query(`
        DROP TYPE "enum_Users_targetLanguage_old";
      `, { transaction });
      
      await transaction.commit();
      console.log('Successfully restored Portuguese to ENUM types');
      
    } catch (error) {
      await transaction.rollback();
      console.error('Error restoring ENUM types:', error);
      throw error;
    }
  }
};
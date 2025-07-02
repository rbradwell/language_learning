'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Update existing categories with their icon paths
      const categoryUpdates = [
        // Mandarin categories
        { name: 'Greetings & Basic Interactions', language: 'Mandarin', iconPath: 'Greetings' },
        { name: 'Family & Relationships', language: 'Mandarin', iconPath: 'FamilyAndRelationships' },
        { name: 'Food & Dining', language: 'Mandarin', iconPath: 'FoodAndDining' },
        { name: 'Shopping & Money', language: 'Mandarin', iconPath: 'ShoppingAndMoney' },
        { name: 'Transportation', language: 'Mandarin', iconPath: 'Transport' },
        { name: 'Work & School', language: 'Mandarin', iconPath: 'WorkAndSchool' },
        { name: 'Health & Body', language: 'Mandarin', iconPath: 'HealthAndBody' },
        { name: 'Weather & Time', language: 'Mandarin', iconPath: 'WeatherAndTime' },
        
        // Portuguese categories  
        { name: 'Greetings & Basic Interactions', language: 'Portuguese', iconPath: 'Greetings' },
        { name: 'Family & Relationships', language: 'Portuguese', iconPath: 'FamilyAndRelationships' },
        { name: 'Food & Dining', language: 'Portuguese', iconPath: 'FoodAndDining' },
        { name: 'Shopping & Money', language: 'Portuguese', iconPath: 'ShoppingAndMoney' },
        { name: 'Transportation', language: 'Portuguese', iconPath: 'Transport' },
        { name: 'Work & School', language: 'Portuguese', iconPath: 'WorkAndSchool' },
        { name: 'Health & Body', language: 'Portuguese', iconPath: 'HealthAndBody' },
        { name: 'Weather & Time', language: 'Portuguese', iconPath: 'WeatherAndTime' }
      ];

      // Update each category with its iconPath
      for (const update of categoryUpdates) {
        await queryInterface.sequelize.query(
          `UPDATE "Categories" SET "iconPath" = :iconPath, "updatedAt" = NOW() 
           WHERE "name" = :name AND "language" = :language`,
          {
            replacements: {
              iconPath: update.iconPath,
              name: update.name,
              language: update.language
            },
            transaction
          }
        );
      }

      await transaction.commit();
      console.log('Successfully updated category icon paths');
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Remove iconPath values (set them back to null)
      await queryInterface.sequelize.query(
        `UPDATE "Categories" SET "iconPath" = NULL, "updatedAt" = NOW()`,
        { transaction }
      );

      await transaction.commit();
      console.log('Successfully removed category icon paths');
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
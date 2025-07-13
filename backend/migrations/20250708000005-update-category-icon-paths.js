'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Update iconPath for Mandarin categories
    await queryInterface.bulkUpdate('Categories', 
      { iconPath: 'Greetings' }, 
      { name: 'Greetings & Basic Interactions', language: 'Mandarin' }
    );
    
    await queryInterface.bulkUpdate('Categories', 
      { iconPath: 'FamilyAndRelationships' }, 
      { name: 'Family & Relationships', language: 'Mandarin' }
    );
    
    await queryInterface.bulkUpdate('Categories', 
      { iconPath: 'FoodAndDining' }, 
      { name: 'Food & Dining', language: 'Mandarin' }
    );
    
    await queryInterface.bulkUpdate('Categories', 
      { iconPath: 'ShoppingAndMoney' }, 
      { name: 'Shopping & Money', language: 'Mandarin' }
    );
    
    await queryInterface.bulkUpdate('Categories', 
      { iconPath: 'Transport' }, 
      { name: 'Transportation', language: 'Mandarin' }
    );
    
    await queryInterface.bulkUpdate('Categories', 
      { iconPath: 'WorkAndSchool' }, 
      { name: 'Work & School', language: 'Mandarin' }
    );
    
    await queryInterface.bulkUpdate('Categories', 
      { iconPath: 'HealthAndBody' }, 
      { name: 'Health & Body', language: 'Mandarin' }
    );
    
    await queryInterface.bulkUpdate('Categories', 
      { iconPath: 'WeatherAndTime' }, 
      { name: 'Weather & Time', language: 'Mandarin' }
    );

    // Update iconPath for Portuguese categories (using same icons)
    await queryInterface.bulkUpdate('Categories', 
      { iconPath: 'Greetings' }, 
      { name: 'Greetings & Basic Interactions', language: 'Portuguese' }
    );
    
    await queryInterface.bulkUpdate('Categories', 
      { iconPath: 'FamilyAndRelationships' }, 
      { name: 'Family & Relationships', language: 'Portuguese' }
    );
    
    await queryInterface.bulkUpdate('Categories', 
      { iconPath: 'FoodAndDining' }, 
      { name: 'Food & Dining', language: 'Portuguese' }
    );
    
    await queryInterface.bulkUpdate('Categories', 
      { iconPath: 'ShoppingAndMoney' }, 
      { name: 'Shopping & Money', language: 'Portuguese' }
    );
    
    await queryInterface.bulkUpdate('Categories', 
      { iconPath: 'Transport' }, 
      { name: 'Transportation', language: 'Portuguese' }
    );
    
    await queryInterface.bulkUpdate('Categories', 
      { iconPath: 'WorkAndSchool' }, 
      { name: 'Work & School', language: 'Portuguese' }
    );
    
    await queryInterface.bulkUpdate('Categories', 
      { iconPath: 'HealthAndBody' }, 
      { name: 'Health & Body', language: 'Portuguese' }
    );
    
    await queryInterface.bulkUpdate('Categories', 
      { iconPath: 'WeatherAndTime' }, 
      { name: 'Weather & Time', language: 'Portuguese' }
    );

    console.log('Updated category icon paths for all languages');
  },

  down: async (queryInterface, Sequelize) => {
    // Reset all iconPath values to null
    await queryInterface.bulkUpdate('Categories', 
      { iconPath: null }, 
      {}
    );
    
    console.log('Reset all category icon paths to null');
  }
};
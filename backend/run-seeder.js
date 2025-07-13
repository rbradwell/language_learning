#!/usr/bin/env node

const { Sequelize } = require('sequelize');
const seeder = require('./seeders/20250713000001-create-missing-vocabulary-exercises.js');

(async () => {
  try {
    // Load database config
    const config = require('./config/config.json')['development'];
    const sequelize = new Sequelize(config);
    
    // Test connection
    await sequelize.authenticate();
    console.log('Database connection established.');
    
    // Run the seeder
    await seeder.up(sequelize.getQueryInterface(), Sequelize);
    
    await sequelize.close();
    console.log('Seeder completed and connection closed.');
    
  } catch (error) {
    console.error('Error running seeder:', error);
    process.exit(1);
  }
})();
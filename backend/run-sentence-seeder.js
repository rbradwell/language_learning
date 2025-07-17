#!/usr/bin/env node

const { Sequelize } = require('sequelize');
const seeder = require('./seeders/20250713000020-create-mandarin-sentences.js');

(async () => {
  try {
    // Load database config
    const config = require('./config/config.js')['development'];
    const sequelize = new Sequelize(config);
    
    // Test connection
    await sequelize.authenticate();
    console.log('Database connection established.');
    
    // Run the seeder
    await seeder.up(sequelize.getQueryInterface(), Sequelize);
    
    await sequelize.close();
    console.log('Sentence seeder completed and connection closed.');
    
  } catch (error) {
    console.error('Error running sentence seeder:', error);
    process.exit(1);
  }
})();
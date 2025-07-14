#!/usr/bin/env node

const { Sequelize } = require('sequelize');
const { execSync } = require('child_process');

(async () => {
  try {
    console.log('Running database migrations...');
    
    // Run migrations using sequelize-cli
    const result = execSync('npx sequelize-cli db:migrate', { 
      cwd: __dirname,
      encoding: 'utf8',
      stdio: 'pipe'
    });
    
    console.log('Migration output:');
    console.log(result);
    console.log('Migrations completed successfully!');
    
  } catch (error) {
    console.error('Migration failed:');
    console.error('STDOUT:', error.stdout?.toString());
    console.error('STDERR:', error.stderr?.toString());
    console.error('Error:', error.message);
    process.exit(1);
  }
})();
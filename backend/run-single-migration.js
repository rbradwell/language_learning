#!/usr/bin/env node

const { execSync } = require('child_process');

(async () => {
  try {
    console.log('Running specific migrations for reverse exercises...');
    
    // Run the enum update migration first
    console.log('\n1. Updating TrailStep enum...');
    const result1 = execSync('npx sequelize-cli db:migrate --migrations-path migrations --match 20250729000002-update-trail-step-enum.js', { 
      cwd: __dirname,
      encoding: 'utf8'
    });
    console.log(result1);
    
    // Run the trail step creation migration
    console.log('\n2. Creating reverse trail steps...');
    const result2 = execSync('npx sequelize-cli db:migrate --migrations-path migrations --match 20250729000001-add-target-to-native-trail-steps.js', { 
      cwd: __dirname,
      encoding: 'utf8'
    });
    console.log(result2);
    
    console.log('\n✅ Reverse exercise migrations completed!');
    
  } catch (error) {
    console.error('Migration failed:');
    console.error('STDOUT:', error.stdout?.toString());
    console.error('STDERR:', error.stderr?.toString());
    console.error('Error:', error.message);
    process.exit(1);
  }
})();
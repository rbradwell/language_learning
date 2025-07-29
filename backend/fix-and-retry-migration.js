#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('=== FIXING MIGRATION ISSUES ===\n');

// 1. Remove the old enum migration file
const oldEnumFile = path.join(__dirname, 'migrations', '20250729000002-update-trail-step-enum.js');
if (fs.existsSync(oldEnumFile)) {
  fs.unlinkSync(oldEnumFile);
  console.log('✅ Removed old enum migration file');
}

// 2. Rollback the failed migration
try {
  console.log('🔄 Rolling back failed migration...');
  execSync('npx sequelize-cli db:migrate:undo', { 
    cwd: __dirname,
    stdio: 'inherit'
  });
  console.log('✅ Rollback completed');
} catch (error) {
  console.log('ℹ️  No migration to rollback or rollback failed');
}

// 3. Run migrations in correct order
try {
  console.log('\n🚀 Running migrations in correct order...');
  execSync('npx sequelize-cli db:migrate', { 
    cwd: __dirname,
    stdio: 'inherit'
  });
  console.log('✅ Migrations completed successfully!');
} catch (error) {
  console.error('❌ Migration failed:', error.message);
  process.exit(1);
}

console.log('\n🎉 All done! Reverse vocabulary matching steps should now be created.');
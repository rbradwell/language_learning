#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Remove the old enum migration file with wrong timestamp
const oldFile = path.join(__dirname, 'migrations', '20250729000002-update-trail-step-enum.js');
if (fs.existsSync(oldFile)) {
  fs.unlinkSync(oldFile);
  console.log('✅ Removed old enum migration file');
} else {
  console.log('ℹ️  Old enum migration file not found');
}

console.log('Migration order fixed. Now run: npx sequelize-cli db:migrate');
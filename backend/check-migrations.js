#!/usr/bin/env node

const { sequelize } = require('./models');

(async () => {
  try {
    console.log('=== CHECKING MIGRATION STATUS ===\n');
    
    // Check which migrations have been run
    const migrations = await sequelize.query(`
      SELECT name, "createdAt" 
      FROM "SequelizeMeta" 
      ORDER BY "createdAt" DESC
      LIMIT 10
    `, { type: sequelize.QueryTypes.SELECT });

    console.log('Recent migrations run:');
    migrations.forEach((migration, i) => {
      const isReverseMigration = migration.name.includes('20250729');
      const icon = isReverseMigration ? '🎯' : '✅';
      console.log(`${icon} ${migration.name} (${migration.createdAt})`);
    });

    // Check if reverse trail steps exist
    const reverseSteps = await sequelize.query(`
      SELECT COUNT(*) as count 
      FROM "TrailSteps" 
      WHERE type = 'vocabulary_matching_reverse'
    `, { type: sequelize.QueryTypes.SELECT });

    console.log(`\nReverse trail steps in database: ${reverseSteps[0].count}`);

    // Check if enum includes the new value
    const enumValues = await sequelize.query(`
      SELECT enumlabel 
      FROM pg_enum 
      WHERE enumtypid = (
        SELECT oid FROM pg_type WHERE typname = 'enum_TrailSteps_type'
      )
      ORDER BY enumlabel
    `, { type: sequelize.QueryTypes.SELECT });

    console.log('\nTrailStep type enum values:');
    enumValues.forEach(val => {
      const isNew = val.enumlabel === 'vocabulary_matching_reverse';
      const icon = isNew ? '🆕' : '  ';
      console.log(`${icon} ${val.enumlabel}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();
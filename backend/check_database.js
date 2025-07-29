const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'languagelearningdb',
  password: 'postgres',
  port: 5432,
});

async function checkDatabase() {
  try {
    console.log('Connecting to database...');
    
    // Check table schema
    console.log('\n=== Table Schema ===');
    const schemaResult = await pool.query(`
      SELECT table_name, column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'VocabularyMatchingExercises' 
      ORDER BY ordinal_position;
    `);
    console.table(schemaResult.rows);

    // Check how many exercises exist per trail step
    console.log('\n=== Count of exercises per trail step ===');
    const countResult = await pool.query(`
      SELECT 
        "trailStepId", 
        COUNT(*) as exercise_count,
        ARRAY_AGG(id) as exercise_ids
      FROM "VocabularyMatchingExercises" 
      GROUP BY "trailStepId" 
      ORDER BY COUNT(*) DESC, "trailStepId";
    `);
    console.table(countResult.rows);

    // Check for trail steps with multiple exercises
    console.log('\n=== Trail steps with more than 1 exercise ===');
    const multipleResult = await pool.query(`
      SELECT 
        "trailStepId", 
        COUNT(*) as exercise_count,
        STRING_AGG(id::text, ', ') as exercise_ids
      FROM "VocabularyMatchingExercises" 
      GROUP BY "trailStepId" 
      HAVING COUNT(*) > 1
      ORDER BY COUNT(*) DESC;
    `);
    console.table(multipleResult.rows);

    // Check migration status
    console.log('\n=== Migration Status Check ===');
    const migrationResult = await pool.query(`
      SELECT name, "createdAt" 
      FROM "SequelizeMeta" 
      WHERE name LIKE '%vocabulary%' OR name LIKE '%simplify%'
      ORDER BY "createdAt" DESC;
    `);
    console.table(migrationResult.rows);

    // Total count
    console.log('\n=== Total exercise count ===');
    const totalResult = await pool.query(`
      SELECT COUNT(*) as total_vocabulary_exercises 
      FROM "VocabularyMatchingExercises";
    `);
    console.table(totalResult.rows);

    // Check if order and category columns still exist
    console.log('\n=== Checking for order and category columns ===');
    const columnsResult = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'VocabularyMatchingExercises' 
      AND column_name IN ('order', 'category');
    `);
    
    if (columnsResult.rows.length > 0) {
      console.log('Found columns:', columnsResult.rows.map(row => row.column_name));
    } else {
      console.log('✅ order and category columns have been removed');
    }

  } catch (error) {
    console.error('Database error:', error);
  } finally {
    await pool.end();
  }
}

checkDatabase();
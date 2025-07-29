#!/bin/bash

# Database connection details
DB_HOST="localhost"
DB_PORT="5432"
DB_NAME="languagelearningdb"
DB_USER="postgres"
DB_PASSWORD="postgres"

export PGPASSWORD="$DB_PASSWORD"

echo "Checking VocabularyMatchingExercises table structure..."

# Check table schema
echo "=== Table Schema ==="
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
SELECT table_name, column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'VocabularyMatchingExercises' 
ORDER BY ordinal_position;
"

echo "=== Count of exercises per trail step ==="
# Check how many exercises exist per trail step
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
SELECT 
    \"trailStepId\", 
    COUNT(*) as exercise_count,
    ARRAY_AGG(id) as exercise_ids
FROM \"VocabularyMatchingExercises\" 
GROUP BY \"trailStepId\" 
ORDER BY exercise_count DESC, \"trailStepId\";
"

echo "=== Trail steps with more than 1 exercise ==="
# Check for trail steps with multiple exercises
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
SELECT 
    \"trailStepId\", 
    COUNT(*) as exercise_count,
    STRING_AGG(id::text, ', ') as exercise_ids
FROM \"VocabularyMatchingExercises\" 
GROUP BY \"trailStepId\" 
HAVING COUNT(*) > 1
ORDER BY exercise_count DESC;
"

echo "=== Migration Status Check ==="
# Check what migrations have been run
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
SELECT name, createdAt 
FROM \"SequelizeMeta\" 
WHERE name LIKE '%vocabulary%' OR name LIKE '%simplify%'
ORDER BY createdAt DESC;
"

echo "=== Total exercise count ==="
# Total count
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
SELECT COUNT(*) as total_vocabulary_exercises 
FROM \"VocabularyMatchingExercises\";
"
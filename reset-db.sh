#!/bin/bash

echo "Resetting database completely..."

# Wait for database to be available
until docker exec language_learning-languagelearningdb-1 pg_isready -U postgres > /dev/null 2>&1; do
  echo "Database not ready, waiting..."
  sleep 2
done

echo "Database is ready!"

# Drop and recreate database
echo "Dropping and recreating database..."
docker exec language_learning-languagelearningdb-1 psql -U postgres -c "
DROP DATABASE IF EXISTS languagelearningdb;
CREATE DATABASE languagelearningdb;
"

echo "Clearing migration history and running fresh migrations..."
cd backend

# Clear any existing migration state
rm -f .sequelizerc 2>/dev/null
npm run db:migrate

# If that fails, manually reset migration state
if [ $? -ne 0 ]; then
  echo "Migration failed, trying to reset migration state..."
  docker exec language_learning-languagelearningdb-1 psql -U postgres -d languagelearningdb -c "
  DROP TABLE IF EXISTS \"SequelizeMeta\";
  "
  npm run db:migrate
fi

if [ $? -eq 0 ]; then
  echo "Migrations successful, seeding database..."
  npm run db:seed
  
  if [ $? -eq 0 ]; then
    echo "Database reset complete!"
  else
    echo "Seeding failed!"
    exit 1
  fi
else
  echo "Migrations failed!"
  exit 1
fi
#!/bin/bash

echo "Waiting for database to be ready..."

# Wait for database to be available
until docker exec language_learning-languagelearningdb-1 pg_isready -U postgres > /dev/null 2>&1; do
  echo "Database not ready, waiting..."
  sleep 2
done

echo "Database is ready!"
sleep 5  # Give it a bit more time

echo "Running migrations..."
cd backend
npm run db:migrate

if [ $? -eq 0 ]; then
  echo "Migrations successful, seeding database..."
  npm run db:seed
  
  if [ $? -eq 0 ]; then
    echo "Database initialization complete!"
  else
    echo "Seeding failed!"
    exit 1
  fi
else
  echo "Migrations failed!"
  exit 1
fi
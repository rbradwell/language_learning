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
    echo "Starting backend server for admin setup..."
    # Start the backend server in background
    npm start &
    SERVER_PID=$!
    
    # Wait for server to be ready
    echo "Waiting for backend server to be ready..."
    until curl -s http://localhost:3000/health > /dev/null 2>&1; do
      echo "Server not ready, waiting..."
      sleep 2
    done
    
    echo "Server is ready! Creating admin user..."
    
    # Create admin user
    ADMIN_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/register \
      -H "Content-Type: application/json" \
      -d '{
        "email": "admin@example.com",
        "password": "Admin123!",
        "username": "admin",
        "targetLanguage": "Mandarin"
      }')
    
    echo "Admin user creation response: $ADMIN_RESPONSE"
    
    # Login to get token
    LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/login \
      -H "Content-Type: application/json" \
      -d '{
        "email": "admin@example.com",
        "password": "Admin123!"
      }')
    
    # Extract token from response
    TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    
    if [ -n "$TOKEN" ]; then
      echo "Admin login successful! Setting up vocabulary exercises..."
      
      # Create vocabulary exercises
      EXERCISES_RESPONSE=$(curl -s -X POST http://localhost:3000/api/admin/bulk-create-vocabulary-exercises \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $TOKEN" \
        -d '{
          "wordsPerExercise": 10,
          "dryRun": false
        }')
      
      echo "Vocabulary exercises setup response: $EXERCISES_RESPONSE"
      echo "Admin setup complete!"
    else
      echo "Failed to get admin token from login response: $LOGIN_RESPONSE"
    fi
    
    # Stop the server
    echo "Stopping backend server..."
    kill $SERVER_PID
    wait $SERVER_PID 2>/dev/null
    
    echo "Database initialization complete!"
  else
    echo "Seeding failed!"
    exit 1
  fi
else
  echo "Migrations failed!"
  exit 1
fi
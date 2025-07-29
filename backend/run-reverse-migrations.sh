#!/bin/bash

echo "=== RUNNING REVERSE VOCABULARY MIGRATIONS ==="
echo ""

echo "1. Checking current migration status..."
node check-migrations.js

echo ""
echo "2. Running pending migrations..."
npx sequelize-cli db:migrate

echo ""
echo "3. Verifying migrations completed..."
node check-migrations.js

echo ""
echo "4. Checking trail step structure..."
node check-trail-order.js
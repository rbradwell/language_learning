#!/bin/bash

echo "=== CHECKING AND FIXING TRAIL STEP ORDER ==="
echo ""

echo "1. Current trail step order:"
node debug-step-order.js

echo ""
echo "2. Running migration to fix step order..."
npx sequelize-cli db:migrate

echo ""
echo "3. Verifying the fix:"
node debug-step-order.js

echo ""
echo "✅ Done! The reverse vocabulary steps should now be in the correct position."
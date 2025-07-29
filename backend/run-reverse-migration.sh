#!/bin/bash
cd /Users/richardbradwell/code/language_app/language_learning/backend

echo "Running migration to add target_to_native trail steps..."
node run-migrations.js

echo "Checking the new trail steps..."
node check-trail-steps.js
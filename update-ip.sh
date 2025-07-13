#!/bin/bash

# Script to automatically update the API base URL with current machine's IP address

# Get the current IP address (excluding loopback)
CURRENT_IP=$(ifconfig | grep "inet " | grep -v "127.0.0.1" | head -1 | awk '{print $2}')

if [ -z "$CURRENT_IP" ]; then
    echo "❌ Could not determine IP address"
    exit 1
fi

echo "🔍 Current IP address: $CURRENT_IP"

# Define the path to the authService file
AUTH_SERVICE_FILE="frontend/src/services/authService.js"

if [ ! -f "$AUTH_SERVICE_FILE" ]; then
    echo "❌ AuthService file not found at $AUTH_SERVICE_FILE"
    exit 1
fi

# Backup the original file
cp "$AUTH_SERVICE_FILE" "$AUTH_SERVICE_FILE.backup"

# Update the IP address in the file
sed -i '' "s|const API_BASE_URL = 'http://[0-9.]*:8080/api';|const API_BASE_URL = 'http://$CURRENT_IP:8080/api';|" "$AUTH_SERVICE_FILE"

# Verify the change
NEW_URL=$(grep "API_BASE_URL" "$AUTH_SERVICE_FILE")
echo "✅ Updated API URL: $NEW_URL"

echo "🚀 IP address updated successfully!"
echo "📱 You may need to restart your React Native development server"
#!/bin/bash

# Script to get Neon connection string and update .env
# This works with Neon MCP server or direct Neon CLI

echo "🔍 Getting Neon connection string..."

# Method 1: Try using neonctl CLI
if command -v neonctl &> /dev/null; then
    echo "✅ Found neonctl CLI"
    echo "Getting connection string..."
    
    # List projects
    PROJECTS=$(neonctl projects list --output json 2>/dev/null)
    
    if [ $? -eq 0 ] && [ ! -z "$PROJECTS" ]; then
        echo "Available projects:"
        echo "$PROJECTS" | jq -r '.[] | "  - \(.name) (ID: \(.id))"' 2>/dev/null || echo "$PROJECTS"
        
        # Get first project's connection string
        CONNECTION_STRING=$(neonctl connection-string --output json 2>/dev/null | jq -r '.connection_uri' 2>/dev/null)
        
        if [ ! -z "$CONNECTION_STRING" ] && [ "$CONNECTION_STRING" != "null" ]; then
            echo ""
            echo "✅ Found connection string!"
            echo "   $CONNECTION_STRING"
            echo ""
            read -p "Use this connection string? (y/n): " confirm
            if [ "$confirm" = "y" ] || [ "$confirm" = "Y" ]; then
                ./update_env.sh "$CONNECTION_STRING"
                exit 0
            fi
        fi
    fi
fi

# Method 2: Manual input
echo ""
echo "📝 Please provide your Neon connection string:"
echo "   You can get it from: https://neon.tech → Your Project → Connection Details"
echo ""
read -p "Enter connection string: " NEON_URL

if [ ! -z "$NEON_URL" ]; then
    ./update_env.sh "$NEON_URL"
else
    echo "❌ No connection string provided"
    exit 1
fi


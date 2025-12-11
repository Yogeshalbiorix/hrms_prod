#!/bin/bash

# HRMS Database Setup Script
# This script helps you set up the Cloudflare D1 database for the HRMS application

echo "🚀 HRMS Database Setup"
echo "====================="
echo ""

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler is not installed. Please install it first:"
    echo "   npm install -g wrangler"
    exit 1
fi

echo "Step 1: Creating D1 Database..."
echo "--------------------------------"

# Create the D1 database
echo "Running: wrangler d1 create hrms-database"
CREATE_OUTPUT=$(wrangler d1 create hrms-database 2>&1)

if [[ $CREATE_OUTPUT == *"already exists"* ]]; then
    echo "⚠️  Database 'hrms-database' already exists"
    echo ""
    echo "To use the existing database:"
    echo "1. Run: wrangler d1 list"
    echo "2. Find your database ID"
    echo "3. Update wrangler.jsonc with the correct database_id"
    echo ""
    read -p "Do you want to continue with initialization? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 0
    fi
else
    echo "$CREATE_OUTPUT"
    echo ""
    echo "✅ Database created!"
    echo ""
    echo "📝 IMPORTANT: Copy the database_id from above and update it in wrangler.jsonc"
    echo "   Look for the line with 'database_id' and replace the placeholder value"
    echo ""
    read -p "Press Enter after updating wrangler.jsonc..."
fi

echo ""
echo "Step 2: Initializing Database Schema (Local)..."
echo "------------------------------------------------"

# Initialize local database for development
echo "Running: wrangler d1 execute hrms-database --local --file=./db/schema.sql"
wrangler d1 execute hrms-database --local --file=./db/schema.sql

if [ $? -eq 0 ]; then
    echo "✅ Local database initialized successfully!"
else
    echo "❌ Failed to initialize local database"
    exit 1
fi

echo ""
echo "Step 3: Verifying Local Database..."
echo "------------------------------------"

# Verify tables were created
echo "Checking tables..."
TABLES=$(wrangler d1 execute hrms-database --local --command="SELECT name FROM sqlite_master WHERE type='table';")
echo "$TABLES"

if [[ $TABLES == *"employees"* ]] && [[ $TABLES == *"departments"* ]]; then
    echo "✅ All tables created successfully!"
else
    echo "⚠️  Some tables might be missing. Please check the output above."
fi

echo ""
echo "Step 4: Production Database Setup"
echo "----------------------------------"
echo "To initialize the production database, run:"
echo "   wrangler d1 execute hrms-database --remote --file=./db/schema.sql"
echo ""
echo "⚠️  WARNING: This will reset all data in your production database!"
echo ""

read -p "Do you want to initialize the production database now? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Initializing production database..."
    wrangler d1 execute hrms-database --remote --file=./db/schema.sql
    
    if [ $? -eq 0 ]; then
        echo "✅ Production database initialized successfully!"
    else
        echo "❌ Failed to initialize production database"
        exit 1
    fi
fi

echo ""
echo "Step 5: Generating TypeScript Types..."
echo "---------------------------------------"
echo "Running: npm run cf-typegen"
npm run cf-typegen

if [ $? -eq 0 ]; then
    echo "✅ TypeScript types generated!"
else
    echo "⚠️  Failed to generate types. You can run 'npm run cf-typegen' manually later."
fi

echo ""
echo "✅ Database Setup Complete!"
echo "=========================="
echo ""
echo "📚 Next Steps:"
echo "1. Start local development: npm run dev"
echo "2. Test API endpoints: curl http://localhost:4321/api/employees"
echo "3. Check DATABASE_SETUP.md for API documentation"
echo ""
echo "🗄️  Database Info:"
echo "   - Local DB: .wrangler/state/v3/d1/miniflare-D1DatabaseObject/*"
echo "   - Remote DB: Configured in wrangler.jsonc"
echo ""
echo "📝 Useful Commands:"
echo "   - List databases: wrangler d1 list"
echo "   - Query local: wrangler d1 execute hrms-database --local --command='SELECT * FROM employees;'"
echo "   - Query remote: wrangler d1 execute hrms-database --remote --command='SELECT * FROM employees;'"
echo ""

#!/bin/bash

# GitHub Push Script for HRMS Project
# This script will help you push your code to GitHub

echo "╔═══════════════════════════════════════════════════════════════════════════╗"
echo "║                  🚀 GitHub Push Helper Script                             ║"
echo "║             Push HRMS Project to GitHub Repository                        ║"
echo "╚═══════════════════════════════════════════════════════════════════════════╝"
echo ""

# Configuration
REPO_URL="https://github.com/Yogeshalbiorix/Hrms.git"

echo "📦 Repository: $REPO_URL"
echo ""

# Step 1: Check if git is initialized
echo "Step 1: Checking Git initialization..."
echo "─────────────────────────────────────────────────────────────────────────────"

if [ ! -d .git ]; then
    echo "⚠️  Git not initialized. Initializing now..."
    git init
    echo "✅ Git repository initialized"
else
    echo "✅ Git already initialized"
fi

echo ""

# Step 2: Configure Git (if needed)
echo "Step 2: Configuring Git..."
echo "─────────────────────────────────────────────────────────────────────────────"

# Check if git user is configured
if [ -z "$(git config user.name)" ]; then
    echo "❓ Git user not configured. Please enter your details:"
    read -p "Enter your name: " git_name
    read -p "Enter your email: " git_email
    git config user.name "$git_name"
    git config user.email "$git_email"
    echo "✅ Git user configured"
else
    echo "✅ Git user already configured:"
    echo "   Name: $(git config user.name)"
    echo "   Email: $(git config user.email)"
fi

echo ""

# Step 3: Check/Add remote
echo "Step 3: Configuring remote repository..."
echo "─────────────────────────────────────────────────────────────────────────────"

if git remote | grep -q "origin"; then
    echo "⚠️  Remote 'origin' already exists:"
    git remote -v
    echo ""
    read -p "Do you want to update it? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git remote set-url origin $REPO_URL
        echo "✅ Remote updated"
    fi
else
    git remote add origin $REPO_URL
    echo "✅ Remote added"
fi

echo ""

# Step 4: Check .gitignore
echo "Step 4: Verifying .gitignore..."
echo "─────────────────────────────────────────────────────────────────────────────"

if [ -f .gitignore ]; then
    echo "✅ .gitignore exists"
    echo "   Checking important exclusions..."
    
    # Check for important entries
    if grep -q "node_modules" .gitignore && grep -q ".env" .gitignore; then
        echo "   ✅ node_modules excluded"
        echo "   ✅ .env excluded"
    else
        echo "   ⚠️  Adding important exclusions..."
        echo "" >> .gitignore
        echo "# Important exclusions" >> .gitignore
        echo "node_modules/" >> .gitignore
        echo ".env" >> .gitignore
        echo ".env.local" >> .gitignore
    fi
else
    echo "⚠️  .gitignore not found. Creating..."
    cat > .gitignore << 'EOF'
# Dependencies
node_modules/
.pnp
.pnp.js

# Testing
coverage/

# Production
dist/
.output/
.vercel/
.netlify/

# Environment
.env
.env.local
.env.production
.env.development.local
.env.test.local
.env.production.local

# Astro
.astro/

# Cloudflare
.wrangler/
.dev.vars

# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*

# Editor
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Temporary
tmp/
temp/
EOF
    echo "✅ .gitignore created"
fi

echo ""

# Step 5: Stage files
echo "Step 5: Staging files for commit..."
echo "─────────────────────────────────────────────────────────────────────────────"

git add .

# Show what will be committed
echo "📋 Files to be committed:"
git status --short | head -20
FILE_COUNT=$(git status --short | wc -l)
echo "   ... and $(($FILE_COUNT - 20)) more files" 

echo ""

# Step 6: Commit
echo "Step 6: Creating commit..."
echo "─────────────────────────────────────────────────────────────────────────────"

# Check if there are changes to commit
if git diff --staged --quiet; then
    echo "⚠️  No changes to commit"
else
    git commit -m "feat: Complete HRMS Application with Database Setup

- Implemented complete HRMS dashboard with React components
- Added Cloudflare D1 database integration
- Created employee management system with full CRUD operations
- Implemented department management
- Added attendance and leave tracking systems
- Created comprehensive API endpoints for all operations
- Added automated database setup script (setup-database.sh)
- Included sample data for testing (5 departments, 5 employees)
- Added 8+ documentation files for easy setup and reference
- Configured TypeScript with proper types
- Set up Cloudflare Workers deployment
- Optimized database with proper indexes

Features:
✅ Employee Management (Create, Read, Update, Delete)
✅ Department Management
✅ Attendance Tracking
✅ Leave Management
✅ Performance Management UI
✅ Recruitment Module UI
✅ Payroll Management UI
✅ Settings & Configuration
✅ Statistics Dashboard
✅ Search & Filter capabilities
✅ RESTful API endpoints
✅ Sample data included

Tech Stack:
- Astro 5.x
- React 19
- Cloudflare D1 (SQLite)
- Cloudflare Workers
- TypeScript
- Tailwind CSS
- shadcn/ui components

Documentation:
- DB_QUICK_START.md - Quick setup guide
- DATABASE_CONFIG.md - Complete configuration
- DATABASE_SETUP.md - API documentation
- SETUP_CHECKLIST.md - Step-by-step checklist
- README_DATABASE.md - Database overview
- And more...

To get started:
1. npm install
2. npm run db:setup
3. npm run dev"
    
    echo "✅ Commit created"
fi

echo ""

# Step 7: Check for existing content
echo "Step 7: Checking remote repository..."
echo "─────────────────────────────────────────────────────────────────────────────"

if git ls-remote --exit-code --heads origin main >/dev/null 2>&1; then
    echo "⚠️  Remote repository has existing content on 'main' branch"
    echo ""
    read -p "Do you want to merge with existing content? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Fetching and merging..."
        git pull origin main --allow-unrelated-histories --no-edit
    fi
elif git ls-remote --exit-code --heads origin master >/dev/null 2>&1; then
    echo "⚠️  Remote repository has existing content on 'master' branch"
    echo ""
    read -p "Do you want to merge with existing content? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Fetching and merging..."
        git pull origin master --allow-unrelated-histories --no-edit
    fi
else
    echo "✅ Remote repository is empty or new"
fi

echo ""

# Step 8: Push to GitHub
echo "Step 8: Pushing to GitHub..."
echo "─────────────────────────────────────────────────────────────────────────────"

echo "🔐 You may be prompted for GitHub authentication"
echo ""
echo "Options:"
echo "  1. Use Personal Access Token (recommended)"
echo "  2. Use SSH (if configured)"
echo "  3. Use GitHub CLI (gh auth login)"
echo ""

read -p "Ready to push? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    # Try to determine the default branch
    DEFAULT_BRANCH=$(git symbolic-ref --short HEAD 2>/dev/null || echo "main")
    
    echo "Pushing to branch: $DEFAULT_BRANCH"
    
    if git push -u origin $DEFAULT_BRANCH; then
        echo ""
        echo "╔═══════════════════════════════════════════════════════════════════════════╗"
        echo "║                                                                           ║"
        echo "║                    ✅  SUCCESS! Code Pushed to GitHub  ✅                ║"
        echo "║                                                                           ║"
        echo "╚═══════════════════════════════════════════════════════════════════════════╝"
        echo ""
        echo "🎉 Your HRMS project is now on GitHub!"
        echo ""
        echo "📍 Repository URL:"
        echo "   $REPO_URL"
        echo ""
        echo "🌐 View your repository:"
        echo "   https://github.com/Yogeshalbiorix/Yogeshalbiorix"
        echo ""
        echo "📝 Next Steps:"
        echo "   1. Visit your repository on GitHub"
        echo "   2. Add a description and topics"
        echo "   3. Consider making it public/private"
        echo "   4. Share with your team!"
        echo ""
    else
        echo ""
        echo "❌ Push failed!"
        echo ""
        echo "Common issues and solutions:"
        echo ""
        echo "1. Authentication failed:"
        echo "   - Use Personal Access Token instead of password"
        echo "   - Generate at: https://github.com/settings/tokens"
        echo "   - Use token as password when prompted"
        echo ""
        echo "2. Repository not found:"
        echo "   - Check repository exists"
        echo "   - Verify you have write access"
        echo ""
        echo "3. Try SSH instead:"
        echo "   git remote set-url origin git@github.com:Yogeshalbiorix/Yogeshalbiorix.git"
        echo "   git push -u origin $DEFAULT_BRANCH"
        echo ""
    fi
else
    echo "❌ Push cancelled"
    echo ""
    echo "You can push later with:"
    echo "   git push -u origin main"
fi

echo ""
echo "────────────────────────────────────────────────────────────────────────────"
echo "Script complete!"
echo ""

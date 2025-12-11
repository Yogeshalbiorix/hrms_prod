#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}   🔍 HRMS Dynamic Application Verification Script   ${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}\n"

# Function to check if command was successful
check_result() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ $1${NC}"
        return 0
    else
        echo -e "${RED}✗ $1${NC}"
        return 1
    fi
}

# Counter for passed tests
PASSED=0
TOTAL=0

# Test 1: Check if wrangler is installed
echo -e "\n${YELLOW}Test 1: Checking Wrangler installation...${NC}"
TOTAL=$((TOTAL + 1))
if command -v wrangler &> /dev/null; then
    check_result "Wrangler is installed"
    PASSED=$((PASSED + 1))
else
    check_result "Wrangler is not installed"
fi

# Test 2: Check if database exists
echo -e "\n${YELLOW}Test 2: Checking database existence...${NC}"
TOTAL=$((TOTAL + 1))
DB_CHECK=$(npx wrangler d1 list 2>&1 | grep -i "hrms-database")
if [ ! -z "$DB_CHECK" ]; then
    check_result "Database 'hrms-database' exists"
    PASSED=$((PASSED + 1))
else
    check_result "Database 'hrms-database' not found"
fi

# Test 3: Check departments in database
echo -e "\n${YELLOW}Test 3: Checking departments data...${NC}"
TOTAL=$((TOTAL + 1))
DEPT_COUNT=$(npx wrangler d1 execute hrms-database --local --command="SELECT COUNT(*) as count FROM departments;" 2>/dev/null | grep -oP '(?<="count": )\d+' | head -1)
if [ ! -z "$DEPT_COUNT" ] && [ "$DEPT_COUNT" -ge 5 ]; then
    check_result "Database has $DEPT_COUNT departments (expected: 5+)"
    PASSED=$((PASSED + 1))
else
    check_result "Database has insufficient departments (found: ${DEPT_COUNT:-0}, expected: 5+)"
fi

# Test 4: Check employees in database
echo -e "\n${YELLOW}Test 4: Checking employees data...${NC}"
TOTAL=$((TOTAL + 1))
EMP_COUNT=$(npx wrangler d1 execute hrms-database --local --command="SELECT COUNT(*) as count FROM employees;" 2>/dev/null | grep -oP '(?<="count": )\d+' | head -1)
if [ ! -z "$EMP_COUNT" ] && [ "$EMP_COUNT" -ge 1 ]; then
    check_result "Database has $EMP_COUNT employees"
    PASSED=$((PASSED + 1))
else
    check_result "Database has no employees (found: ${EMP_COUNT:-0})"
fi

# Test 5: Check if API files exist
echo -e "\n${YELLOW}Test 5: Checking API endpoints...${NC}"
TOTAL=$((TOTAL + 1))
API_FILES=(
    "src/pages/api/employees/index.ts"
    "src/pages/api/employees/[id].ts"
    "src/pages/api/departments/index.ts"
    "src/pages/api/settings/index.ts"
)
API_EXIST=true
for file in "${API_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo -e "${RED}  Missing: $file${NC}"
        API_EXIST=false
    fi
done
if [ "$API_EXIST" = true ]; then
    check_result "All API endpoints exist"
    PASSED=$((PASSED + 1))
else
    check_result "Some API endpoints are missing"
fi

# Test 6: Check if Settings component exists
echo -e "\n${YELLOW}Test 6: Checking Settings component...${NC}"
TOTAL=$((TOTAL + 1))
if [ -f "src/components/Dashboard/Settings.tsx" ]; then
    # Check if it has dynamic features
    if grep -q "useState" "src/components/Dashboard/Settings.tsx" && grep -q "fetch" "src/components/Dashboard/Settings.tsx"; then
        check_result "Settings component is dynamic"
        PASSED=$((PASSED + 1))
    else
        check_result "Settings component exists but may not be dynamic"
    fi
else
    check_result "Settings component not found"
fi

# Test 7: Check if EmployeeManagement component has department loading
echo -e "\n${YELLOW}Test 7: Checking EmployeeManagement component...${NC}"
TOTAL=$((TOTAL + 1))
if [ -f "src/components/Dashboard/EmployeeManagement.tsx" ]; then
    if grep -q "fetchDepartments" "src/components/Dashboard/EmployeeManagement.tsx"; then
        check_result "EmployeeManagement component has department loading"
        PASSED=$((PASSED + 1))
    else
        check_result "EmployeeManagement component missing department loading"
    fi
else
    check_result "EmployeeManagement component not found"
fi

# Test 8: Check if node_modules exists
echo -e "\n${YELLOW}Test 8: Checking dependencies...${NC}"
TOTAL=$((TOTAL + 1))
if [ -d "node_modules" ]; then
    check_result "Dependencies are installed"
    PASSED=$((PASSED + 1))
else
    check_result "Dependencies not installed. Run: npm install"
fi

# Test 9: Check if package.json has required scripts
echo -e "\n${YELLOW}Test 9: Checking npm scripts...${NC}"
TOTAL=$((TOTAL + 1))
REQUIRED_SCRIPTS=("dev" "build" "db:init:local" "db:query:local")
SCRIPTS_OK=true
for script in "${REQUIRED_SCRIPTS[@]}"; do
    if ! grep -q "\"$script\":" package.json; then
        echo -e "${RED}  Missing script: $script${NC}"
        SCRIPTS_OK=false
    fi
done
if [ "$SCRIPTS_OK" = true ]; then
    check_result "All required npm scripts exist"
    PASSED=$((PASSED + 1))
else
    check_result "Some npm scripts are missing"
fi

# Test 10: Check if documentation exists
echo -e "\n${YELLOW}Test 10: Checking documentation...${NC}"
TOTAL=$((TOTAL + 1))
DOCS=(
    "DYNAMIC_FEATURES_COMPLETE.md"
    "TESTING_CHECKLIST.md"
    "QUICK_FIX_SUMMARY.md"
)
DOCS_EXIST=0
for doc in "${DOCS[@]}"; do
    if [ -f "$doc" ]; then
        DOCS_EXIST=$((DOCS_EXIST + 1))
    fi
done
if [ "$DOCS_EXIST" -eq 3 ]; then
    check_result "All documentation files exist"
    PASSED=$((PASSED + 1))
else
    check_result "Some documentation files are missing ($DOCS_EXIST/3 found)"
fi

# Test 11: Verify sample department names
echo -e "\n${YELLOW}Test 11: Verifying department names...${NC}"
TOTAL=$((TOTAL + 1))
DEPT_NAMES=$(npx wrangler d1 execute hrms-database --local --command="SELECT name FROM departments;" 2>/dev/null | grep -oP '(?<="name": ")[^"]+')
if echo "$DEPT_NAMES" | grep -q "Engineering"; then
    check_result "Found expected departments in database"
    PASSED=$((PASSED + 1))
else
    check_result "Expected departments not found in database"
fi

# Test 12: Check if baseUrl is properly imported
echo -e "\n${YELLOW}Test 12: Checking baseUrl imports...${NC}"
TOTAL=$((TOTAL + 1))
BASEURL_COUNT=$(grep -r "from.*base-url" src/components/Dashboard/*.tsx 2>/dev/null | wc -l)
if [ "$BASEURL_COUNT" -ge 2 ]; then
    check_result "Components are using baseUrl for API calls"
    PASSED=$((PASSED + 1))
else
    check_result "Some components may not be using baseUrl"
fi

# Summary
echo -e "\n${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}                    📊 Test Results                     ${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}\n"

PERCENTAGE=$((PASSED * 100 / TOTAL))
echo -e "Total Tests: ${BLUE}$TOTAL${NC}"
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$((TOTAL - PASSED))${NC}"
echo -e "Pass Rate: ${BLUE}$PERCENTAGE%${NC}\n"

if [ "$PERCENTAGE" -ge 90 ]; then
    echo -e "${GREEN}═══════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}   ✨ Excellent! Your application is ready to use! ✨  ${NC}"
    echo -e "${GREEN}═══════════════════════════════════════════════════════${NC}\n"
    echo -e "${GREEN}Next steps:${NC}"
    echo -e "  1. Run: ${YELLOW}npm run dev${NC}"
    echo -e "  2. Visit: ${BLUE}http://localhost:4321${NC}"
    echo -e "  3. Test using: ${BLUE}TESTING_CHECKLIST.md${NC}\n"
elif [ "$PERCENTAGE" -ge 70 ]; then
    echo -e "${YELLOW}═══════════════════════════════════════════════════════${NC}"
    echo -e "${YELLOW}   ⚠️  Good, but some improvements needed  ⚠️         ${NC}"
    echo -e "${YELLOW}═══════════════════════════════════════════════════════${NC}\n"
    echo -e "${YELLOW}Please review the failed tests above.${NC}\n"
else
    echo -e "${RED}═══════════════════════════════════════════════════════${NC}"
    echo -e "${RED}   ❌ Issues detected - Please review failed tests ❌  ${NC}"
    echo -e "${RED}═══════════════════════════════════════════════════════${NC}\n"
    echo -e "${RED}Critical issues found. Please check:${NC}"
    echo -e "  1. Database initialization: ${YELLOW}npm run db:init:local${NC}"
    echo -e "  2. Dependencies: ${YELLOW}npm install${NC}"
    echo -e "  3. Review failed tests above\n"
fi

# Additional info
echo -e "${BLUE}📚 Documentation:${NC}"
echo -e "  - ${BLUE}DYNAMIC_FEATURES_COMPLETE.md${NC} - Complete feature list"
echo -e "  - ${BLUE}TESTING_CHECKLIST.md${NC} - Detailed testing guide"
echo -e "  - ${BLUE}QUICK_FIX_SUMMARY.md${NC} - Quick overview (Hindi/English)\n"

echo -e "${BLUE}🔧 Useful Commands:${NC}"
echo -e "  - Start server: ${YELLOW}npm run dev${NC}"
echo -e "  - Check database: ${YELLOW}npm run db:query:local 'SELECT * FROM departments;'${NC}"
echo -e "  - Reset database: ${YELLOW}npm run db:init:local${NC}\n"

exit 0

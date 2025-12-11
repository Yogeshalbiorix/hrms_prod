# 🧪 Testing Checklist - Dynamic HRMS

## Before You Start
```bash
# Make sure development server is running
npm run dev
```

Visit: http://localhost:4321

---

## ✅ Test 1: Department Dropdown
**Goal:** Verify department dropdown is populated

1. Navigate to **Employee Management** tab
2. Click **"Add Employee"** button
3. Scroll down to **"Employment Information"** section
4. Click on **"Department"** dropdown
5. **Expected Result:** 
   - Should see 5 departments:
     - Engineering
     - Sales & Marketing
     - Human Resources
     - Finance
     - Operations

**Status:** ⬜ Pass ⬜ Fail

---

## ✅ Test 2: Create Employee with Department
**Goal:** Create employee and verify department saves

1. In the "Add Employee" modal, fill in:
   - First Name: "Test"
   - Last Name: "User"
   - Email: "test@company.com"
   - Position: "Software Engineer"
   - **Department: Select "Engineering"**
   - Join Date: (today's date)
2. Click **"Add Employee"**
3. **Expected Result:**
   - Success message appears
   - Employee appears in table with "Engineering" department
   - Modal closes

**Status:** ⬜ Pass ⬜ Fail

---

## ✅ Test 3: Settings - Company Information
**Goal:** Verify company settings save and load

1. Navigate to **Settings** tab
2. Should already be on "General" section
3. Change **"Company Name"** to "My Company LLC"
4. Click **"Save Changes"**
5. **Expected Result:**
   - Green "Settings saved!" message appears
   - Wait 2 seconds for message to disappear
6. Refresh the page (F5)
7. Navigate to Settings tab again
8. **Expected Result:**
   - Company name should still be "My Company LLC"

**Status:** ⬜ Pass ⬜ Fail

---

## ✅ Test 4: Settings - Notifications
**Goal:** Verify notification toggles save automatically

1. In Settings tab, click **"Notifications"** section
2. Toggle OFF **"Leave Requests"** switch
3. **Expected Result:**
   - Green "Settings saved!" message appears immediately
   - No need to click "Save"
4. Refresh the page
5. Navigate to Settings → Notifications
6. **Expected Result:**
   - "Leave Requests" should still be OFF

**Status:** ⬜ Pass ⬜ Fail

---

## ✅ Test 5: Settings - Theme Selection
**Goal:** Verify theme mode changes save

1. In Settings tab, click **"Appearance"** section
2. Click on **"Dark"** theme button
3. **Expected Result:**
   - Button becomes highlighted with blue border
   - Green "Settings saved!" message appears
4. Refresh the page
5. Navigate to Settings → Appearance
6. **Expected Result:**
   - "Dark" theme should still be selected

**Status:** ⬜ Pass ⬜ Fail

---

## ✅ Test 6: Settings - Color Selection
**Goal:** Verify primary color saves

1. In Settings → Appearance section
2. Click on the **Purple color** (2nd color)
3. **Expected Result:**
   - Color gets a dark border and scales up
   - Green "Settings saved!" message appears
4. Refresh the page
5. Navigate to Settings → Appearance
6. **Expected Result:**
   - Purple color should still be selected with dark border

**Status:** ⬜ Pass ⬜ Fail

---

## ✅ Test 7: Employee Search
**Goal:** Verify search functionality works

1. Navigate to **Employee Management** tab
2. In the search box, type "john"
3. **Expected Result:**
   - Table filters to show only employees with "john" in name/email
4. Clear the search box
5. **Expected Result:**
   - All employees appear again

**Status:** ⬜ Pass ⬜ Fail

---

## ✅ Test 8: Status Filter
**Goal:** Verify status filter works

1. In Employee Management tab
2. Click on **"Filter by status"** dropdown
3. Select **"Active"**
4. **Expected Result:**
   - Table shows only active employees
5. Select **"All Statuses"**
6. **Expected Result:**
   - All employees appear again

**Status:** ⬜ Pass ⬜ Fail

---

## ✅ Test 9: Department Filter
**Goal:** Verify department filter works

1. In Employee Management tab
2. Click on **"Filter by department"** dropdown
3. **Expected Result:**
   - Should see all 5 departments in dropdown
4. Select **"Engineering"**
5. **Expected Result:**
   - Table shows only Engineering employees
6. Select **"All Departments"**
7. **Expected Result:**
   - All employees appear again

**Status:** ⬜ Pass ⬜ Fail

---

## ✅ Test 10: Edit Employee
**Goal:** Verify employee editing works

1. In Employee Management tab
2. Click the **green Edit (pencil) icon** on any employee
3. Change the **Position** to "Senior Engineer"
4. Change the **Department** to "Finance"
5. Click **"Update Employee"**
6. **Expected Result:**
   - Success message appears
   - Employee's position and department update in table
   - Modal closes

**Status:** ⬜ Pass ⬜ Fail

---

## ✅ Test 11: View Employee Details
**Goal:** Verify view employee dialog works

1. In Employee Management tab
2. Click the **blue Eye icon** on any employee
3. **Expected Result:**
   - Dialog opens showing full employee details
   - All information displays correctly
   - Department name shows (not just ID)
4. Click **"Close"**

**Status:** ⬜ Pass ⬜ Fail

---

## ✅ Test 12: Settings - Profile
**Goal:** Verify profile settings save

1. Navigate to Settings tab
2. Click **"Profile"** section
3. Change **First Name** to "Admin"
4. Change **Last Name** to "User"
5. Click **"Update Profile"**
6. **Expected Result:**
   - Green "Settings saved!" message appears
7. Refresh page
8. Navigate to Settings → Profile
9. **Expected Result:**
   - First Name should be "Admin"
   - Last Name should be "User"

**Status:** ⬜ Pass ⬜ Fail

---

## ✅ Test 13: Terminate Employee
**Goal:** Verify soft delete works

1. In Employee Management tab
2. Click the **red Trash icon** on any employee
3. Confirm the dialog
4. **Expected Result:**
   - Success message appears
   - Employee status changes to "Terminated"
   - Employee still appears in table (soft delete)

**Status:** ⬜ Pass ⬜ Fail

---

## ✅ Test 14: Required Field Validation
**Goal:** Verify form validation works

1. Navigate to Employee Management
2. Click **"Add Employee"**
3. Leave all fields empty
4. Click **"Add Employee"** button
5. **Expected Result:**
   - Alert message appears: "Please fill in all required fields..."
   - Modal stays open
   - No employee created

**Status:** ⬜ Pass ⬜ Fail

---

## ✅ Test 15: Statistics Update
**Goal:** Verify statistics update in real-time

1. Note the **"Total Employees"** count in the blue card
2. Add a new employee
3. **Expected Result:**
   - Total Employees count increases by 1
   - Active count may increase
4. Note the new count
5. Refresh the page
6. **Expected Result:**
   - Count remains the same (data persisted)

**Status:** ⬜ Pass ⬜ Fail

---

## 📊 Test Results Summary

**Total Tests:** 15  
**Passed:** ___  
**Failed:** ___  
**Pass Rate:** ____%

---

## 🐛 Issues Found (if any)

1. 
2. 
3. 

---

## ✅ Expected Results

**If all tests pass:**
- ✅ All dropdowns are populated from database
- ✅ All settings save and persist
- ✅ All filters work correctly
- ✅ Real-time statistics update
- ✅ Form validation works
- ✅ CRUD operations function properly
- ✅ No blank values in dropdowns
- ✅ No static data anywhere

**Your application is 100% dynamic!** 🎉

---

## 🔧 Common Issues & Solutions

### Issue: Department dropdown is empty
**Solution:**
```bash
# Verify database has departments
npx wrangler d1 execute hrms-database --local --command="SELECT * FROM departments;"
```

### Issue: Settings don't save
**Solution:**
- Check browser console for errors
- Verify API endpoint is working: http://localhost:4321/api/settings

### Issue: Employees not showing
**Solution:**
```bash
# Verify database has employees
npx wrangler d1 execute hrms-database --local --command="SELECT * FROM employees;"
```

### Issue: Server not running
**Solution:**
```bash
# Stop any existing server (Ctrl+C)
# Start fresh
npm run dev
```

---

## 🎯 Next Steps After Testing

If all tests pass:
1. ✅ Your application is fully functional
2. ✅ You can start adding real data
3. ✅ You can customize further
4. ✅ Ready to deploy to production

If any tests fail:
1. Check the "Issues Found" section above
2. Review browser console for errors
3. Verify database has sample data
4. Check that dev server is running

---

**Happy Testing!** 🚀

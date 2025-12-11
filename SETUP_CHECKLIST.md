# ✅ Database Setup Checklist

Use this checklist to track your database setup progress.

---

## 🚀 Quick Setup (Recommended)

- [ ] **Step 1**: Run automated setup
  ```bash
  npm run db:setup
  ```

- [ ] **Step 2**: Follow the interactive prompts

- [ ] **Step 3**: Verify setup
  ```bash
  npm run db:query:local "SELECT * FROM employees;"
  ```

- [ ] **Step 4**: Start development
  ```bash
  npm run dev
  ```

- [ ] **Step 5**: Test in browser
  - Visit: http://localhost:4321
  - Test API: http://localhost:4321/api/employees

✅ **Done!** Your database is ready.

---

## 🔧 Manual Setup (Alternative)

### Phase 1: Database Creation
- [ ] Create D1 database
  ```bash
  npm run db:create
  ```

- [ ] Copy the `database_id` from output

- [ ] Update `wrangler.jsonc` with your database_id
  ```jsonc
  "database_id": "paste-your-id-here"
  ```

### Phase 2: Database Initialization
- [ ] Initialize local database
  ```bash
  npm run db:init:local
  ```

- [ ] Verify tables created
  ```bash
  npm run db:query:local "SELECT name FROM sqlite_master WHERE type='table';"
  ```

- [ ] Check sample data loaded
  ```bash
  npm run db:query:local "SELECT COUNT(*) FROM employees;"
  ```

### Phase 3: TypeScript Setup
- [ ] Generate TypeScript types
  ```bash
  npm run cf-typegen
  ```

- [ ] Verify `worker-configuration.d.ts` updated

### Phase 4: Testing
- [ ] Start dev server
  ```bash
  npm run dev
  ```

- [ ] Test dashboard loads
  - [ ] Navigate to http://localhost:4321

- [ ] Test API endpoints
  - [ ] `GET /api/employees` works
  - [ ] `GET /api/departments` works
  - [ ] `GET /api/employees/1` works

- [ ] Verify sample data appears
  - [ ] 5 departments visible
  - [ ] 5 employees visible

✅ **Done!** Your database is ready.

---

## 🚀 Production Setup (Optional)

Only do this when ready to deploy:

- [ ] Initialize production database
  ```bash
  npm run db:init:remote
  ```

- [ ] Verify production database
  ```bash
  npm run db:query:remote "SELECT COUNT(*) FROM employees;"
  ```

- [ ] Build application
  ```bash
  npm run build
  ```

- [ ] Deploy to Cloudflare
  ```bash
  wrangler deploy
  ```

- [ ] Test production endpoints

✅ **Production Ready!**

---

## 🧪 Verification Tests

Run these to verify everything is working:

### Database Tests
- [ ] Tables exist
  ```bash
  npm run db:query:local "SELECT name FROM sqlite_master WHERE type='table';"
  ```
  Expected: departments, employees, employee_attendance, employee_leave_history, employee_documents

- [ ] Departments loaded (should return 5)
  ```bash
  npm run db:query:local "SELECT COUNT(*) FROM departments;"
  ```

- [ ] Employees loaded (should return 5)
  ```bash
  npm run db:query:local "SELECT COUNT(*) FROM employees;"
  ```

### API Tests
- [ ] List all employees
  ```bash
  curl http://localhost:4321/api/employees
  ```

- [ ] Get single employee
  ```bash
  curl http://localhost:4321/api/employees/1
  ```

- [ ] List departments
  ```bash
  curl http://localhost:4321/api/departments
  ```

- [ ] Search employees
  ```bash
  curl "http://localhost:4321/api/employees?search=sarah"
  ```

### Dashboard Tests
- [ ] Dashboard loads without errors
- [ ] Employee count displays (should show 5)
- [ ] Department stats visible
- [ ] Navigation works

✅ **All Tests Passed!**

---

## 📊 Expected Results

After successful setup, you should see:

### Database
- ✅ 5 tables created
- ✅ 5 departments
- ✅ 5 employees
- ✅ Attendance records
- ✅ Leave requests

### API Endpoints
- ✅ `GET /api/employees` → Returns array of employees
- ✅ `GET /api/employees/:id` → Returns single employee
- ✅ `POST /api/employees` → Creates employee
- ✅ `PUT /api/employees/:id` → Updates employee
- ✅ `DELETE /api/employees/:id` → Deletes employee
- ✅ `GET /api/departments` → Returns array of departments

### Dashboard
- ✅ Overview stats visible
- ✅ Employee list loads
- ✅ Department list loads
- ✅ Navigation functional

---

## 🔍 Troubleshooting

### Issue: Database not found

**Symptom**: Error when running queries

**Solution**:
- [ ] Run `npm run db:list` to verify database exists
- [ ] Check `wrangler.jsonc` has correct `database_id`
- [ ] Re-run `npm run db:init:local`

### Issue: No data in database

**Symptom**: API returns empty arrays

**Solution**:
- [ ] Re-initialize: `npm run db:init:local`
- [ ] Verify: `npm run db:query:local "SELECT * FROM employees;"`

### Issue: Type errors

**Symptom**: TypeScript errors about DB binding

**Solution**:
- [ ] Run `npm run cf-typegen`
- [ ] Restart TypeScript server in your editor

### Issue: API 500 errors

**Symptom**: API endpoints return 500

**Solution**:
- [ ] Check database is initialized
- [ ] Verify dev server is running
- [ ] Check browser console for errors

---

## 📚 Documentation Reference

If you get stuck, check these docs:

- [ ] **Quick Start**: `DB_QUICK_START.md`
- [ ] **Full Configuration**: `DATABASE_CONFIG.md`
- [ ] **API Reference**: `DATABASE_SETUP.md`
- [ ] **Status**: `DATABASE_STATUS.md`

---

## 🎯 Success Criteria

Your setup is complete when:

- ✅ Database created and initialized
- ✅ TypeScript types generated
- ✅ Dev server runs without errors
- ✅ API endpoints return data
- ✅ Dashboard displays sample data
- ✅ All verification tests pass

---

## 🎉 Next Steps

After completing this checklist:

1. **Explore the Dashboard**
   - Navigate through different sections
   - Test employee management features
   - Check attendance and leave modules

2. **Customize for Your Needs**
   - Add custom fields to schema
   - Create new API endpoints
   - Build additional features

3. **Deploy to Production**
   - Follow production setup checklist above
   - Test in production environment
   - Monitor performance

---

**Happy Coding!** 🚀

Your HRMS database is ready to power your application!

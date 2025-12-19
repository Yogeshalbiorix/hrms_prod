# Admin Panel Access

## Admin Credentials

**Username:** `admin`  
**Email:** `admin@hrms.com`  
**Password:** `admin123`  
**Role:** `admin`

## Admin Panel Features

The admin panel (HRMS Dashboard) includes full access to:

### 📊 Dashboard
- Overview of all employees
- Attendance statistics
- Department distribution
- Recent activities
- Quick actions

### 👥 Employee Management
- Add/Edit/Delete employees
- View employee details
- Manage employee status
- Employee profiles

### 🏢 Department Management
- Create and manage departments
- View department employees
- Department statistics

### 📅 Attendance & Leave
- View all attendance records
- Approve/reject leave requests
- Attendance reports
- Leave balance management

### 🏗️ Organization Structure
- Organization hierarchy view
- Team assignments
- Manager assignments
- Reporting structure

### 💰 Payroll Management
- Process payroll
- View salary records
- Generate payslips
- Payroll reports

### 👔 Recruitment
- Post job openings
- Manage applications
- Track hiring pipeline
- Job requirements

### 📈 Performance Management
- Performance reviews
- Goal tracking
- Employee ratings

### 🔔 Notifications
- System notifications
- Announcements
- Activity tracking

## Role-Based Access

The system supports 4 user roles:

1. **admin** - Full system access (Admin Panel)
2. **hr** - HR management features
3. **manager** - Team management features
4. **employee** - Personal dashboard (limited access)

## How to Login

1. Go to http://localhost:3000/
2. Enter username: `admin`
3. Enter password: `admin123`
4. Click "Sign In"

You will be automatically redirected to the admin dashboard based on your role.

## Security Note

⚠️ **IMPORTANT**: Change the default admin password immediately in production!

The default password `admin123` is only for development/testing purposes.

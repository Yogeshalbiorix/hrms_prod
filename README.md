# 🏢 HRMS - Human Resource Management System

A complete, modern Human Resource Management System built with **Astro**, **React**, **TypeScript**, and **Cloudflare D1**.

![HRMS Dashboard](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)
![Astro](https://img.shields.io/badge/Astro-5.x-orange)
![React](https://img.shields.io/badge/React-19.x-61dafb)

---

## ✨ Features

### 📊 Dashboard Overview
- Real-time employee statistics
- Department analytics
- Attendance tracking
- Leave management overview
- Performance metrics

### 👥 Employee Management
- Complete CRUD operations
- Advanced search and filtering
- Employee profiles with detailed information
- Document management
- Employment history tracking

### 🏢 Department Management
- Department creation and management
- Employee assignments
- Department statistics

### 📅 Attendance Tracking
- Daily attendance records
- Check-in/check-out system
- Attendance reports
- Late arrival tracking

### 🌴 Leave Management
- Leave requests and approvals
- Multiple leave types (sick, vacation, personal, etc.)
- Leave balance tracking
- Approval workflow

### 📈 Additional Modules
- Performance Management UI
- Recruitment Module
- Payroll Management Interface
- Settings & Configuration

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18.x or higher
- npm or yarn
- Cloudflare account (for deployment)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Yogeshalbiorix/Yogeshalbiorix.git
   cd Yogeshalbiorix
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up the database**
   ```bash
   npm run db:setup
   ```
   
   This automated script will:
   - Create Cloudflare D1 database
   - Initialize schema with sample data
   - Generate TypeScript types

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   ```
   http://localhost:4321
   ```

That's it! Your HRMS is running with sample data. 🎉

---

## 📖 Documentation

| Document | Description |
|----------|-------------|
| [DB_QUICK_START.md](./DB_QUICK_START.md) | Quick database setup (5 minutes) |
| [DATABASE_CONFIG.md](./DATABASE_CONFIG.md) | Complete database configuration guide |
| [DATABASE_SETUP.md](./DATABASE_SETUP.md) | Full API documentation |
| [SETUP_CHECKLIST.md](./SETUP_CHECKLIST.md) | Step-by-step setup checklist |
| [README_DATABASE.md](./README_DATABASE.md) | Database overview and usage |

---

## 🗄️ Database

### Schema Overview

The system uses **Cloudflare D1** (SQLite) with 5 main tables:

- **departments** - Company departments
- **employees** - Complete employee records
- **employee_attendance** - Daily attendance tracking
- **employee_leave_history** - Leave requests and approvals
- **employee_documents** - Document management

### Sample Data Included

- ✅ 5 Departments (Engineering, Sales, HR, Finance, Operations)
- ✅ 5 Sample Employees with realistic data
- ✅ Attendance records
- ✅ Leave requests

---

## 🔌 API Endpoints

### Employee Endpoints

```
GET    /api/employees              List all employees
POST   /api/employees              Create new employee
GET    /api/employees/:id          Get employee details
PUT    /api/employees/:id          Update employee
DELETE /api/employees/:id          Delete employee
```

### Department Endpoints

```
GET    /api/departments            List all departments
POST   /api/departments            Create new department
```

### Query Parameters

```
?search=term                       Search employees
?departmentId=1                    Filter by department
?status=active                     Filter by status
?stats=true                        Include statistics
```

### Example Requests

```bash
# Get all employees
curl http://localhost:4321/api/employees

# Search employees
curl "http://localhost:4321/api/employees?search=john"

# Get employee by ID
curl http://localhost:4321/api/employees/1

# Create new employee
curl -X POST http://localhost:4321/api/employees \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "John",
    "last_name": "Doe",
    "email": "john.doe@company.com",
    "position": "Developer",
    "join_date": "2025-01-01"
  }'
```

---

## 🛠️ Tech Stack

### Frontend
- **Astro 5.x** - Modern static site framework
- **React 19** - UI components and interactivity
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **shadcn/ui** - Component library

### Backend
- **Cloudflare Workers** - Serverless compute
- **Cloudflare D1** - SQLite database
- **Astro API Routes** - RESTful endpoints

### Tools & DevOps
- **Wrangler** - Cloudflare development tool
- **npm** - Package management
- **Git** - Version control

---

## 📁 Project Structure

```
hrms-project/
├── src/
│   ├── components/          # React components
│   │   ├── Dashboard/       # Dashboard modules
│   │   └── ui/              # shadcn/ui components
│   ├── pages/               # Astro pages
│   │   ├── api/             # API endpoints
│   │   └── index.astro      # Main dashboard
│   ├── lib/                 # Utility functions
│   │   └── db.ts            # Database operations
│   └── styles/              # Global styles
├── db/
│   ├── schema.sql           # Database schema
│   └── test-queries.sql     # Example queries
├── generated/               # Webflow generated files
├── site-components/         # Devlink components
├── wrangler.jsonc           # Cloudflare configuration
├── astro.config.mjs         # Astro configuration
├── package.json             # Dependencies & scripts
└── Documentation/           # Comprehensive guides
```

---

## 💻 Development

### Available Scripts

```bash
# Development
npm run dev                  # Start dev server
npm run build                # Build for production
npm run preview              # Preview production build

# Database
npm run db:setup             # Complete database setup
npm run db:create            # Create D1 database
npm run db:init:local        # Initialize local database
npm run db:init:remote       # Initialize production database
npm run db:list              # List databases
npm run db:query:local       # Query local database

# Deployment
npm run deploy               # Deploy to Cloudflare
npm run cf-typegen           # Generate TypeScript types
```

### Database Setup

**Option 1: Automated (Recommended)**
```bash
npm run db:setup
```

**Option 2: Manual**
```bash
npm run db:create
# Update wrangler.jsonc with database_id
npm run db:init:local
npm run cf-typegen
```

---

## 🚀 Deployment

### Deploy to Cloudflare Workers

1. **Login to Cloudflare**
   ```bash
   npx wrangler login
   ```

2. **Initialize production database**
   ```bash
   npm run db:init:remote
   ```

3. **Deploy application**
   ```bash
   npm run deploy
   ```

4. **Your app is live!** 🎉

---

## 🧪 Testing

### Test Database

```bash
# Check tables exist
npm run db:query:local "SELECT name FROM sqlite_master WHERE type='table';"

# Count employees
npm run db:query:local "SELECT COUNT(*) FROM employees;"

# View all employees
npm run db:query:local "SELECT * FROM employees;"
```

### Test API Endpoints

```bash
# Start development server
npm run dev

# In another terminal, test endpoints
curl http://localhost:4321/api/employees
curl http://localhost:4321/api/departments
```

---

## 🔒 Security

### Before Production

- [ ] Implement authentication (JWT/OAuth)
- [ ] Add API rate limiting
- [ ] Enable CORS properly
- [ ] Add input validation
- [ ] Implement role-based access control
- [ ] Encrypt sensitive data
- [ ] Set up monitoring and logging
- [ ] Configure environment variables

### Environment Variables

Create `.env` file:

```env
# Cloudflare
CLOUDFLARE_ACCOUNT_ID=your-account-id
CLOUDFLARE_API_TOKEN=your-api-token

# Database (auto-generated)
# Database binding is in wrangler.jsonc
```

---

## 📊 Sample Data

### Departments (5)
1. Engineering
2. Sales & Marketing
3. Human Resources
4. Finance
5. Operations

### Employees (5)
1. **Sarah Johnson** - Senior Developer (Engineering) - Active
2. **Michael Chen** - Sales Manager (Sales & Marketing) - Active
3. **Emily Rodriguez** - HR Specialist (Human Resources) - On Leave
4. **David Kim** - Financial Analyst (Finance) - Active
5. **Jessica Brown** - Operations Lead (Operations) - Active

All with complete profiles, attendance records, and leave history!

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 🐛 Troubleshooting

### Database not found
```bash
# Reinitialize database
npm run db:init:local
```

### Type errors
```bash
# Regenerate types
npm run cf-typegen
```

### API returns empty data
```bash
# Reset database with sample data
npm run db:init:local
```

### Port already in use
```bash
# Kill port 4321
npx kill-port 4321
# Or use different port
npm run dev -- --port 3000
```

For more help, see [DATABASE_CONFIG.md](./DATABASE_CONFIG.md)

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👤 Author

**Yogesh Albiorix**

- GitHub: [@Yogeshalbiorix](https://github.com/Yogeshalbiorix)
- Repository: [Yogeshalbiorix/Yogeshalbiorix](https://github.com/Yogeshalbiorix/Yogeshalbiorix)

---

## 🙏 Acknowledgments

- Built with [Astro](https://astro.build)
- UI components from [shadcn/ui](https://ui.shadcn.com)
- Hosted on [Cloudflare Workers](https://workers.cloudflare.com)
- Database by [Cloudflare D1](https://developers.cloudflare.com/d1)

---

## 📞 Support

Need help? Check out:

- 📖 [Documentation](./DB_QUICK_START.md)
- 🐛 [Issue Tracker](https://github.com/Yogeshalbiorix/Yogeshalbiorix/issues)
- 💬 [Discussions](https://github.com/Yogeshalbiorix/Yogeshalbiorix/discussions)

---

## ⭐ Star This Repository

If you find this project useful, please give it a star! ⭐

---

**Made with ❤️ using Astro, React, and Cloudflare**

*Last Updated: December 2025*

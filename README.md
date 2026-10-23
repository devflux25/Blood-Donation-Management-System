# Blood Donation Management System (BDMS)

A full-stack, enterprise-grade Blood Bank & Healthcare Logistics Web Application built for college DBMS demonstrations and university projects.

---

## 🌟 Key Features

1. **Dashboard Analytics**:
   - Total registered and medically eligible donors
   - Available blood units across all 8 standard blood groups (`A+`, `A-`, `B+`, `B-`, `AB+`, `AB-`, `O+`, `O-`)
   - Pending emergency hospital requests
   - Recharts visual charts for inventory breakdown and 6-month voluntary donation trends
2. **Donor Management**:
   - Donor registration, contact details, blood groups, and eligibility tracking
   - Automated 90-day donation interval / deferral checking
3. **Donation Management**:
   - Screening vital logs (hemoglobin, blood pressure, pulse rate)
   - Automatic generation of cold-chain inventory batches upon completion
4. **Blood Inventory & Cold Storage**:
   - Batch-level tracking with shelf life and expiry dates
   - Low-stock threshold warnings and expiring-soon flags
5. **Hospital Blood Requests & ACID Issuing**:
   - Emergency (`Normal`, `Urgent`, `Critical`) hospital requisition workflow
   - FIFO (Earliest Expiry First) transactional batch allocation with atomic updates and zero double-issuing risk
6. **Donation Events & Camps**:
   - Public mobilization camps, venues, capacity controls, and donor pre-registrations
7. **Role-Based Access Control**:
   - JWT authentication with `admin` and `staff` roles and password hashing with `bcrypt`
8. **Reports & Exports**:
   - SQL analytical summaries and one-click CSV export

---

## 🛠️ Technology Stack

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Lucide React, Recharts, Axios, React Router v6
- **Backend**: Python 3.10+, FastAPI, SQLAlchemy ORM, PyMySQL, Pydantic v2, Python-Jose (JWT), Passlib
- **Database**: MySQL Community Server 8.0+ (`blood_donation_db`)

---

## 📁 Project Structure

```
Blood-Donation-Management-System/
├── backend/
│   ├── app/
│   │   ├── api/             # Modular API routes (auth, donors, inventory, requests, etc.)
│   │   ├── core/            # Config, database engine, security tokens
│   │   ├── models/          # SQLAlchemy relational models
│   │   ├── schemas/         # Pydantic validation schemas
│   │   ├── services/        # Business logic & ACID blood issuing transaction
│   │   └── main.py          # FastAPI application entry point
│   ├── tests/               # Backend security and configuration tests
│   ├── create_admin.py      # Interactive administrator CLI provisioner
│   ├── requirements.txt     # Python backend dependencies
│   └── .env.example         # Template for environment variables
├── frontend/
│   ├── src/
│   │   ├── api/             # Centralized Axios client with JWT interceptor
│   │   ├── context/         # AuthContext provider
│   │   ├── layouts/         # Responsive sidebar & navigation layout
│   │   ├── pages/           # Dashboard, Donors, Donations, Inventory, Requests, etc.
│   │   └── types/           # TypeScript interfaces
│   ├── package.json
│   └── vite.config.ts
├── database/
│   ├── schema.sql           # MySQL 8.0 DDL database schema with views & check constraints
│   ├── seed.sql             # Comprehensive fictional development dataset
│   ├── queries.sql          # Working queries (JOINs, aggregations, subqueries, CTEs, transactions)
│   └── ER_DIAGRAM.md        # Entity-Relationship diagram and cardinality documentation
├── docs/
│   └── ARCHITECTURE.md      # Technical architecture and API specification
├── .gitignore
└── README.md
```

---

## 🚀 Setup & Execution Guide (Windows)

### Step 1: Database Initialization (MySQL)

1. Open **MySQL Workbench** or your MySQL command prompt.
2. Ensure MySQL server is running on `127.0.0.1:3306`.
3. Create the database:
   ```sql
   CREATE DATABASE IF NOT EXISTS blood_donation_db;
   ```
4. Open and execute `database/schema.sql` in MySQL Workbench to build all tables, foreign keys, and reporting views.
5. *(Optional for demo data)* Open and execute `database/seed.sql` to import sample donors, hospitals, events, and inventory batches.

---

### Step 2: Backend Setup & Launch

1. Open a PowerShell terminal in the repository root:
   ```powershell
   cd backend
   ```
2. Copy the example configuration to `.env`:
   ```powershell
   Copy-Item .env.example .env
   ```
3. Edit `backend/.env` with your actual MySQL `root` password:
   ```ini
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_NAME=blood_donation_db
   DB_USER=root
   DB_PASSWORD=YOUR_MYSQL_PASSWORD_HERE
   JWT_SECRET_KEY=my_secure_blood_bank_secret_key_32_chars
   ```
4. Activate the virtual environment:
   ```powershell
   .\venv\Scripts\Activate.ps1
   ```
   *(If venv is not yet initialized, run `python -m venv venv` and `.\venv\Scripts\pip install -r requirements.txt`)*
5. *(Optional)* Provision an administrator account interactively:
   ```powershell
   python create_admin.py
   ```
   *(Or use default seed admin: `admin@bloodbank.org` / `Admin@123`)*
6. Start the FastAPI development server:
   ```powershell
   uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
   ```
7. Verify backend services:
   - **Interactive API Docs (Swagger UI)**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
   - **Database Health**: [http://127.0.0.1:8000/api/health/db](http://127.0.0.1:8000/api/health/db)

---

### Step 3: Frontend Setup & Launch

1. In a **new PowerShell terminal**, navigate to `frontend`:
   ```powershell
   cd frontend
   ```
2. Ensure Node.js (v18+) is installed. Install dependencies:
   ```powershell
   npm install
   ```
3. Start the Vite development server:
   ```powershell
   npm run dev
   ```
4. Open your browser and navigate to:
   - **Frontend Application**: [http://localhost:5173](http://localhost:5173)
   - Sign in with:
     - **Email**: `admin@bloodbank.org`
     - **Password**: `Admin@123`

---

## 🧪 Testing Backend

Run automated security and authentication unit tests:
```powershell
$env:PYTHONPATH="backend"
.\backend\venv\Scripts\pytest.exe backend/tests/test_security.py
```
*(All 3 security tests pass: password hashing verification, JWT token expiration check, and CORS configuration check).*

---

## 🩺 System Settings & Operational Rules

Configurable operational parameters stored in `system_settings`:
- `low_stock_threshold`: Minimum units per blood group before warning alert triggers (default: 5 units).
- `expiring_soon_days`: Days ahead to flag inventory in early warning report (default: 7 days).
- `min_donation_gap_days`: Minimum days required between voluntary whole blood donations (default: 90 days).
- `whole_blood_shelf_life_days`: Maximum shelf life for whole blood units in cold storage (default: 42 days).

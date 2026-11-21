# Planova — Smart Task Management

> **Organize Smarter. Achieve More.**  
> Full-Stack Task & Productivity Platform — Group 5

Planova is a full-stack task management and smart productivity web application built with **React, TypeScript, Vite, FastAPI, SQLAlchemy, and MySQL**. It features user authentication, role-based access control (User and Admin portals), personal and administrative dashboards, interactive Kanban boards, schedule calendars, subtask checklists, custom tags, deadline reminders, in-app notifications, audit activity histories, and customizable user preferences with seamless dark mode support.

---

## Architecture & Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, TypeScript, Vite, Lucide Icons, Modern CSS Design System (Custom properties, CSS Grid, Fluid Responsive) |
| **Backend** | Python 3.10+, FastAPI, Pydantic v2, SQLAlchemy ORM, PyMySQL, PyJWT, Argon2id (`pwdlib[argon2]`) |
| **Database** | MySQL 8.0+ / MariaDB (`utf8mb4_unicode_ci`), Foreign key cascades, ACID transactional operations |
| **Security** | Argon2id password hashing, HMAC-SHA256 JWT sessions, Role-Based Access Control (RBAC), multi-tenant data boundaries, CORS hardening |

---

## Project Structure

```text
todo-app-project-5/
├── frontend/               # React 19 + TypeScript client (Vite)
│   ├── public/             # Static assets, branding, and icons
│   ├── src/
│   │   ├── components/     # UI components (LandingPage, AuthView, Dashboard,
│   │   │                   # TaskWorkspace, KanbanBoard, TaskCalendar,
│   │   │                   # TaskFormModal, AdminDashboard, AdminUserManagement,
│   │   │                   # AdminTaskOverview, SettingsView, NotificationBell)
│   │   ├── context/        # Auth and theme context providers
│   │   ├── styles/         # Global typography, color variables, and layouts
│   │   ├── types/          # TypeScript contracts and interfaces
│   │   └── *API.ts         # Type-safe API client services
│   ├── .env.example        # Frontend environment template
│   └── package.json        # Frontend dependencies and scripts
│
├── fastapi-backend/        # FastAPI REST API service
│   ├── app/
│   │   ├── database/       # SQLAlchemy engine and session factory
│   │   ├── dependencies/   # Auth and DB dependency injection
│   │   ├── models/         # SQLAlchemy ORM models (User, Task, Category,
│   │   │                   # Subtask, Tag, Reminder, Notification, Activity, Prefs)
│   │   ├── routes/         # API controllers (auth, tasks, categories, admin,
│   │   │                   # subtasks, tags, reminders, notifications, preferences)
│   │   ├── schemas/        # Pydantic v2 validation contracts
│   │   └── services/       # Business logic and security services
│   ├── scripts/            # Admin provisioning, migrations, and automated tests
│   ├── .env.example        # Backend environment template
│   ├── requirements.txt    # Python dependencies
│   └── main.py             # FastAPI application entrypoint
│
├── database/               # Database schemas and versioned migrations
│   ├── schema.sql          # Initial database schema (users, categories, tasks)
│   └── migrations/         # Versioned incremental migrations
│       └── v2_step7_smart_productivity.sql # Tables 4-10 (subtasks, tags, reminders, etc.)
│
├── .gitignore              # Git ignore rules
└── README.md               # Project documentation and setup guide
```

---

## Prerequisites

Ensure you have the following installed on your machine:
- **Node.js** v18.0.0 or higher
- **npm** v9.0.0 or higher
- **Python** 3.10, 3.11, or 3.12
- **MySQL Server** 8.0+ or **MariaDB** 10.4+

---

## Setup Instructions

### 1. Database Setup

1. Start your local MySQL service (e.g., via MySQL Workbench, Command Line, or XAMPP).
2. Connect to MySQL as an administrative user:
   ```bash
   mysql -u root -p
   ```
3. Initialize the database schema and versioned migrations:
   ```sql
   CREATE DATABASE IF NOT EXISTS todo_app CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   USE todo_app;
   SOURCE database/schema.sql;
   SOURCE database/migrations/v2_step7_smart_productivity.sql;
   ```

All 10 application tables (`users`, `categories`, `tasks`, `subtasks`, `tags`, `task_tags`, `reminders`, `notifications`, `task_activity_logs`, `user_preferences`) will be created.

---

### 2. Backend Setup (FastAPI)

1. Navigate to the backend directory:
   ```bash
   cd fastapi-backend
   ```
2. Create and activate a Python virtual environment:
   - **Windows (PowerShell):**
     ```powershell
     python -m venv venv
     .\venv\Scripts\Activate.ps1
     ```
   - **macOS / Linux:**
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Configure environment variables:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Update `.env` with your MySQL credentials and a secure random JWT secret (at least 32 characters):
   ```env
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=todo_app

   JWT_SECRET_KEY=generate_a_random_secret_minimum_32_characters_here
   JWT_ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=60
   ```

---

### 3. Secure Administrator Provisioning

To create or promote an administrative account without exposing plaintext credentials in scripts or logs, run the interactive masked CLI utility:

```bash
python scripts/promote_admin.py
```
Follow the prompts to enter the admin email and a secure password (passwords are masked in the terminal and hashed with Argon2id).

---

### 4. Running the Backend Server

Start the FastAPI application with Uvicorn:

```bash
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

- API Base URL: `http://localhost:8000`
- Interactive Swagger Documentation: `http://localhost:8000/docs`
- ReDoc Documentation: `http://localhost:8000/redoc`

---

### 5. Frontend Setup (React + Vite)

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install frontend dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables (optional, defaults to `http://localhost:8000`):
   ```bash
   cp .env.example .env
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

- Web Application URL: `http://localhost:5173`

---

## Running Verification & Automated Test Suites

### Backend Security & End-to-End Suite (56 Tests)
Validates public routing, Argon2id security, JWT signing/expiry, RBAC, tenant isolation, and task workflows:

```bash
cd fastapi-backend
python scripts/test_step9_security_and_e2e.py
```

### Frontend TypeScript Verification & Production Build
```bash
cd frontend
npx tsc --noEmit
npm run build
```

---

## Authors & Contributions (Group 5)

- **Nitish Gupta** — Full-stack integration, security hardening, landing page, routing, modal audit, and documentation.
- **Sarthak Santosh Kene** — Database design, SQL schemas, foreign key relationships, and migration architecture.
- **Sanyukta** — Task form modal, input validation, subtasks, tags, and form logic.
- **Ishwari** — Task workspace, dashboard views, task cards, and category organization.
- **Sanskruti** — Navigation, layout components, sidebar, and theme coordination.

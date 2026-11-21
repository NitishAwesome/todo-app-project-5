# To-Do App Project

A full-stack To-Do application built with React (Vite + TypeScript), FastAPI (Python + SQLAlchemy + JWT), and MySQL.

## Project Structure

```text
todo-app-project-5/
├── frontend/          # React + TypeScript frontend (Vite)
├── fastapi-backend/   # FastAPI Python backend with JWT auth & Task CRUD APIs
├── database/          # Database schemas, migrations, and seed scripts (MySQL/MariaDB)
├── docs/              # Architecture diagrams and documentation
├── .gitignore         # Git ignore rules
└── README.md          # Project overview and setup instructions
```

## Getting Started

### 1. Database
Import `database/schema.sql` and `database/seed.sql` into MySQL / MariaDB.

### 2. Backend (FastAPI)
```bash
cd fastapi-backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
Swagger API docs available at `http://localhost:8000/docs`.

### 3. Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
```
Accessible at `http://localhost:5173`.


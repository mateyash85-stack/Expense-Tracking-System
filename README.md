# Expense Tracking System — FastAPI Backend

REST API built with **Python + FastAPI + Supabase** (Postgres + Auth).

> The Node.js backend still exists in `/Backend` — this is an alternative implementation.

## Structure

```
FastAPI_Backend/
├── main.py                      ← Entry point (uvicorn)
├── requirements.txt
├── .env.example
├── app/
│   ├── main.py                  ← FastAPI app, CORS, routes
│   ├── config/
│   │   ├── settings.py          ← Pydantic settings (reads .env)
│   │   └── supabase.py          ← Supabase clients (anon + admin)
│   ├── models/                  ← Pydantic request/response schemas
│   │   ├── auth.py
│   │   ├── category.py
│   │   └── expense.py
│   ├── controllers/             ← Business logic
│   │   ├── auth_controller.py
│   │   ├── category_controller.py
│   │   └── expense_controller.py
│   ├── routes/                  ← FastAPI routers
│   │   ├── auth_routes.py
│   │   ├── category_routes.py
│   │   └── expense_routes.py
│   └── middlewares/
│       └── auth.py              ← JWT Bearer guard (Supabase)
```

## Setup

### 1. Create virtual environment
```bash
python -m venv .venv
.venv\Scripts\activate        # Windows
source .venv/bin/activate      # Mac/Linux
```

### 2. Install dependencies
```bash
pip install -r requirements.txt
```

### 3. Configure environment
```bash
cp .env.example .env
# Fill in your Supabase keys
```

### 4. Run the server
```bash
python main.py
```

Server starts at `http://localhost:8001`

Interactive docs at `http://localhost:8001/docs`

## API Endpoints

| Method | Endpoint                    | Auth | Description           |
|--------|-----------------------------|------|-----------------------|
| GET    | /api/health                 | No   | Health check          |
| POST   | /api/auth/register          | No   | Register user         |
| POST   | /api/auth/login             | No   | Login → returns JWT   |
| POST   | /api/auth/logout            | No   | Logout                |
| POST   | /api/auth/refresh           | No   | Refresh access token  |
| GET    | /api/auth/me                | Yes  | Get current user      |
| GET    | /api/expenses               | Yes  | List expenses         |
| GET    | /api/expenses/summary       | Yes  | Income/expense totals |
| GET    | /api/expenses/{id}          | Yes  | Get single expense    |
| POST   | /api/expenses               | Yes  | Create expense        |
| PUT    | /api/expenses/{id}          | Yes  | Update expense        |
| DELETE | /api/expenses/{id}          | Yes  | Delete expense        |
| GET    | /api/categories             | Yes  | List categories       |
| POST   | /api/categories             | Yes  | Create category       |
| PUT    | /api/categories/{id}        | Yes  | Update category       |
| DELETE | /api/categories/{id}        | Yes  | Delete category       |

## Interactive Docs

FastAPI auto-generates Swagger UI — open in browser:
```
http://localhost:8001/docs
```

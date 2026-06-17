# Expense Tracking System — Backend

REST API built with **Node.js + Express**, backed by **Supabase** (Postgres + Auth).

## Structure

```
Backend/
└── src/
    ├── server.js               # Entry point
    ├── app.js                  # Express app setup
    ├── config/
    │   └── supabase.js         # Supabase client (anon + service role)
    ├── db/
    │   └── schema.sql          # Postgres schema — run once in Supabase SQL Editor
    ├── controllers/
    │   ├── auth.controller.js
    │   ├── category.controller.js
    │   └── expense.controller.js
    ├── routes/
    │   ├── auth.routes.js
    │   ├── category.routes.js
    │   └── expense.routes.js
    └── middlewares/
        ├── auth.middleware.js      # Supabase JWT verification
        ├── error.middleware.js     # Global error handler
        └── validate.middleware.js  # express-validator helper
```

## Setup

### 1. Create a Supabase project
Go to https://supabase.com → New project

### 2. Run the schema
In your Supabase dashboard → **SQL Editor** → paste and run `src/db/schema.sql`

### 3. Get your API keys
Dashboard → **Settings → API**
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`  
- `SUPABASE_SERVICE_ROLE_KEY`

### 4. Configure environment
```bash
cp .env.example .env
# Fill in your Supabase keys
```

### 5. Install and run
```bash
npm install
npm run dev
```

## API Endpoints

| Method | Endpoint                  | Auth | Description            |
|--------|---------------------------|------|------------------------|
| POST   | /api/auth/register        | No   | Register user          |
| POST   | /api/auth/login           | No   | Login → returns JWT    |
| POST   | /api/auth/logout          | No   | Logout                 |
| POST   | /api/auth/refresh         | No   | Refresh access token   |
| GET    | /api/auth/me              | Yes  | Get current user       |
| GET    | /api/expenses             | Yes  | List expenses          |
| GET    | /api/expenses/summary     | Yes  | Income/expense totals  |
| GET    | /api/expenses/:id         | Yes  | Get single expense     |
| POST   | /api/expenses             | Yes  | Create expense         |
| PUT    | /api/expenses/:id         | Yes  | Update expense         |
| DELETE | /api/expenses/:id         | Yes  | Delete expense         |
| GET    | /api/categories           | Yes  | List categories        |
| POST   | /api/categories           | Yes  | Create category        |
| PUT    | /api/categories/:id       | Yes  | Update category        |
| DELETE | /api/categories/:id       | Yes  | Delete category        |

## Query params — GET /api/expenses

| Param       | Example              | Description           |
|-------------|----------------------|-----------------------|
| type        | `type=expense`       | Filter by type        |
| category_id | `category_id=<uuid>` | Filter by category    |
| startDate   | `startDate=2024-01-01` | From date           |
| endDate     | `endDate=2024-12-31` | To date               |
| page        | `page=2`             | Pagination            |
| limit       | `limit=10`           | Items per page        |

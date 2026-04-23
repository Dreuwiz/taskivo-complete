# Taskivo — Full Stack Setup Guide

## Overview
```
frontend/             ← your existing Vite React project
backend/              ← new Node.js/Express backend (put this alongside frontend)
```

---

## Step 1 — Supabase Setup

1. Go to https://supabase.com → create a free project
2. Go to **SQL Editor** → paste the entire contents of `supabase_schema.sql` → click **Run**
   - ⚠️ Before running, you need real bcrypt hashes for the seed users (see Step 3)

---

## Step 2 — Backend Setup

```bash
# Place the backend/ folder alongside your frontend/ folder, then:
cd backend
npm install
```

Copy `.env.example` to `.env` and fill in your values:
```
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key   # Settings → API → service_role
JWT_SECRET=any_long_random_string
PORT=3001
```

---

## Step 3 — Generate Password Hashes for Seed Data

```bash
cd backend
node scripts/hashPasswords.js
```

Copy each hash into `supabase_schema.sql`, replacing the placeholder `$2b$10$YourHashHere...` values. Then run the SQL in Supabase.

---

## Step 4 — Frontend Setup

1. Copy these files into your `frontend/src/` folder:
   - `src-updates/App.jsx`              → replaces `src/App.jsx`
   - `src-updates/pages/LoginScreen.jsx` → replaces `src/pages/LoginScreen.jsx`
   - `src-updates/pages/AnalyticsPage.jsx` → replaces `src/pages/AnalyticsPage.jsx`
   - `src-updates/services/api.js`      → new file at `src/services/api.js`

2. Install Google Charts for React:
```bash
cd frontend
npm install react-google-charts
```

---

## Step 5 — Run Both Servers

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
```
Server runs at: http://localhost:3001

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```
App runs at: http://localhost:5173

---

## API Endpoints

| Method | Endpoint          | Auth | Description              |
|--------|-------------------|------|--------------------------|
| POST   | /api/auth/login   | ✗    | Login, returns JWT token |
| GET    | /api/auth/me      | ✓    | Get current user         |
| GET    | /api/tasks        | ✓    | Get tasks (role-scoped)  |
| POST   | /api/tasks        | ✓    | Create task              |
| PUT    | /api/tasks/:id    | ✓    | Update task              |
| DELETE | /api/tasks/:id    | ✓    | Delete task              |
| GET    | /api/users        | ✓    | Get all users            |
| POST   | /api/users        | ✓    | Create user (admin only) |
| PUT    | /api/users/:id    | ✓    | Update user              |
| DELETE | /api/users/:id    | ✓    | Delete user (admin only) |
| GET    | /api/audit        | ✓    | Get audit log            |
| POST   | /api/audit        | ✓    | Add audit entry          |

---

## Login Credentials (after seeding)

| Email               | Password   | Role         |
|---------------------|------------|--------------|
| alice@taskivo.com   | alice123   | User/Staff   |
| dan@taskivo.com     | dan123     | Team Leader  |
| frank@taskivo.com   | frank123   | Manager      |
| grace@taskivo.com   | grace123   | Admin        |

---

## Password Reset Process

Taskivo currently uses an admin-managed password reset flow.

1. A user who forgot their password contacts an Admin or Manager.
2. In `User Management`, open the user in edit mode.
3. Enter a temporary password in the `Reset Password` field.
4. Save the user record.
5. Share the temporary password with the user so they can sign in.

There is no self-serve "Forgot Password" email flow in this project yet.

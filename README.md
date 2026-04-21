# Smart city issue reporting

Thesis project: citizens report urban issues (with photos and map coordinates); municipal **admins** review and update report status. Stack: **Node.js (Express)**, **MongoDB (Mongoose)**, **React** (`citizen-web`, `admin-web`).

## Documentation

- [API contract & auth rules](docs/API.md)
- [Admins: seed / UI / Compass](docs/mongodb-admins.md)
- [ClickUp structure template](docs/clickup-setup.md)
- [Thesis deliverables checklist](docs/thesis-deliverables.md)

## Prerequisites

- Node.js 18+ and npm
- MongoDB (local or Atlas)

## Backend

```bash
cd backend
cp .env.example .env
# Edit .env: MONGO_URI, JWT_SECRET
npm install
node seedLebanonLocations.js
npm run seed:admins
npm run dev
```

API default: `http://localhost:5000`.

**Admins:** run `npm run seed:admins` after locations — creates **one admin per district** (+ optional extras in [`backend/seedAdmins.js`](backend/seedAdmins.js)). Override password with env **`SEED_ADMIN_PASSWORD`**. Or use **`/create-admin`** / Compass — [docs/mongodb-admins.md](docs/mongodb-admins.md).

## citizen-web (port 3001)

```bash
cd citizen-web
cp .env.example .env
npm install
npm start
```

**Windows note:** If `npm install` in `citizen-web` hits repeated `TAR_ENTRY_ERROR` issues, you can share dependencies with `admin-web` (same versions) using a junction after a successful `admin-web` install:

`mklink /J citizen-web\node_modules admin-web\node_modules` (run from Command Prompt in the repo root). Remove any partial `citizen-web\node_modules` first.

## admin-web (port 3000)

```bash
cd admin-web
cp .env.example .env
npm install
npm start
```

Run **admin** and **citizen** apps on different ports so both can be open while testing.

After signing in to **admin-web**, use **Change password** in the header (`/account/password`) so each district admin can set their own password (calls `PATCH /api/admin/me/password`).

## Quick test flow

1. Start MongoDB and backend; seed scripts as above.
2. **citizen-web**: register → **New report** (images + lat/lng) → **My reports** → open report → add comment.
3. **admin-web**: log in with a seeded admin (e.g. from `seedAdmins.js`) → **Reports** → open a report → change **status** → save.

## Repo layout

| Folder | Role |
|--------|------|
| `backend/` | REST API, uploads, seeds |
| `citizen-web/` | Citizen React app |
| `admin-web/` | Admin React app |
| `docs/` | API + thesis/ClickUp helpers |

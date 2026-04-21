# Creating admins

You can add admins in three ways: **seed file** (like locations), **temporary web UI**, or **MongoDB Compass**.

## Option A — Seed file (recommended for repeatable local data)

1. Seed **governorates + districts** first, then **admins**:

```bash
cd backend
node seedLebanonLocations.js
npm run seed:admins
```

2. The script creates **one `DISTRICT_ADMIN` per district** in the database, with generated emails like `admin.north.tripoli@local.test` (governorate + district name slugs). Optional **`EXTRA_ADMINS`** at the top of [`backend/seedAdmins.js`](../backend/seedAdmins.js) adds fixed accounts (e.g. a super admin).
3. Set **`SEED_ADMIN_PASSWORD`** in `.env` if you do not want the script default; all newly created rows use that password unless an extra row sets its own `password` field.
4. Existing emails are **skipped** (safe to re-run).

## Option B — Temporary web UI

1. Set **`ADMIN_SETUP_TOKEN`** in `backend/.env` and restart the API.
2. Open admin-web at **`/create-admin`**, enter the token and admin details.
3. Remove the token (and later the route/page) when finished. See also [API.md](./API.md).

## Option C — MongoDB Compass

Add each admin manually in Compass (or any Mongo client).

### Collection and model

- **Collection name:** `admins` (Mongoose default for model `Admin`).
- **Required fields:** `fullName`, `email`, `passwordHash`, `role`, `districtId` (for district admins).

### 1. Get a `passwordHash` (bcrypt)

From the **`backend`** folder:

```bash
node scripts/hashPassword.js "YourSecurePassword"
```

or:

```bash
npm run hash-password -- "YourSecurePassword"
```

Copy the printed string into **`passwordHash`** in the document. The API compares logins with **bcrypt**, so plain text passwords will not work.

### 2. Get `districtId`

1. Open the **`districts`** collection.
2. Find the district row for that admin.
3. Copy its **`_id`** (ObjectId).

### 3. Insert one district admin in Compass

Use **Insert document** on `admins` with JSON like:

```json
{
  "fullName": "Beirut District Admin",
  "email": "admin.beirut.district@example.com",
  "passwordHash": "<paste output from hashPassword.js>",
  "role": "DISTRICT_ADMIN",
  "districtId": { "$oid": "PASTE_DISTRICT_OBJECT_ID_HERE" }
}
```

In Compass you can also pick **ObjectId** from the type menu for `districtId` instead of the `$oid` wrapper.

#### Rules

- **`email`:** unique, stored lowercase (use lowercase in Compass to match).
- **`role`:** use **`DISTRICT_ADMIN`** for one-district scope; use **`SUPER_ADMIN`** only if that user should see **all** districts (`districtId` can be `null` for super admin).
- **`districtId`:** required for **`DISTRICT_ADMIN`** to list reports (JWT carries this id). If it is missing or wrong, that admin will get **403** on `/api/admin/reports`.

### 4. Optional super admin

If you want one user who sees every report:

```json
{
  "fullName": "Super Admin",
  "email": "super@example.com",
  "passwordHash": "<bcrypt hash>",
  "role": "SUPER_ADMIN",
  "districtId": null
}
```

(`districtId` may be omitted or set to `null`.)

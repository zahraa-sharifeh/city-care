# Smart City Issue Reporting — Feature & Implementation Report

Consolidated description of features, roles, APIs, and business rules as implemented in this repository. For endpoint details, see [API.md](./API.md).

---

## 1. Purpose and stack

**Purpose:** Citizens submit urban issues (text, photos, map location, governorate/district). Municipal **admins** review reports in scope, update status and priority, assign departments, and handle **duplicate** suggestions. Optional **notifications** and **email** inform citizens when status changes.

| Layer | Technology |
|--------|------------|
| API | Node.js, Express |
| Data | MongoDB, Mongoose |
| Auth | JWT (`Authorization: Bearer <token>`) |
| Citizen UI | React (`citizen-web`) |
| Admin UI | React (`admin-web`) |
| Maps | Leaflet (both apps) |
| Uploads | Multer; files served under `/uploads` |

---

## 2. Roles and access control

| Role | Scope |
|------|--------|
| **Citizen** | Own profile, own reports; may **comment** on any report (see §8); likes on public/community flows where exposed; notifications |
| **DISTRICT_ADMIN** | Reports where `report.districtId` equals the admin’s `districtId`. If `districtId` is unset on the admin, list/detail/update/analytics return **403** |
| **SUPER_ADMIN** | All reports; optional `districtId` filter on report list; **only** role that can **create** departments |

**JWT payloads**

- Citizen: `id`, `type: "citizen"`
- Admin: `id`, `type: "admin"`, `role`, `districtId` (nullable for super admin)

**Report access** (`backend/src/services/reportAccess.js`): District checks normalize IDs so both raw ObjectIds and populated refs (e.g. `{ _id, name }`) compare correctly for admin detail and comments.

---

## 3. Citizen application (`citizen-web`)

### Public / auth

- Register, login, optional **Google sign-in** (when `GOOGLE_CLIENT_ID` is configured; see [API.md](./API.md))
- Forgot password, reset password
- Help page

### Authenticated

| Area | Behavior |
|------|----------|
| **My reports** | Paginated list of the signed-in user’s reports |
| **New report** | Multipart: category, description, governorate/district, location description, **lat/lng**, **1–5 images**; server validates district belongs to governorate |
| **Report detail** | View **own** report (`GET /api/reports/:id`); **GET**/**POST** `/api/reports/:id/comments` per §8 (comments also surface on public explore where wired) |
| **Map** | Map view (Leaflet) |
| **Profile** | View profile; edit profile; change password |
| **Notifications** | List; mark one read; mark all read |

**UI labels:** API enums (e.g. `PENDING`) map to friendly labels (e.g. “Submitted”) via shared utilities. Categories use `src/constants/issueCategories.js`.

---

## 4. Admin application (`admin-web`)

### Auth

- Admin login
- Change password: `PATCH /api/admin/me/password`

### Reports

| Feature | Details |
|---------|---------|
| **Reports list** | Pagination; filters: status, priority, category, department, date range; super admin can filter by governorate/district; optional map of results; super admin can create departments inline |
| **Report detail** | Map, images, citizen info, department; update **status**, **priority**, **status note**, **department** |
| **Duplicates** | Server suggests candidates (see §6); **Mark duplicate** / **Mark as not duplicate**; UI reflects saved state (disabled / labels after action) |

### District spotlight (civic content)

- **Admin:** Page **District spotlight** — per district: long-form **essay**, **heritage & culture** text, and a list of **events / highlights** (title, optional date, venue, link, summary). **District admins** edit their district only; **super admins** pick governorate + district.
- **Citizen:** **Discover** (`/discover`) — public page to choose governorate/district and read published content (`GET /api/districts/:districtId/spotlight`). Logged-in users with a profile district may see it pre-selected when the profile includes populated `districtId`.

### Analytics

- `GET /api/admin/analytics` with optional `dateFrom`, `dateTo`
- KPIs: total reports, top category (from top-12 category breakdown), open count (`PENDING` + `IN_PROGRESS`)
- Breakdowns: status, priority, duplicate-review state, top categories table
- Daily submission trend (bar heights relative to max day in range)
- **Note:** District-scoped analytics uses **ObjectId** for `districtId` in aggregation `$match` so district admins see correct aggregates (JWT string `districtId` is parsed before matching).

---

## 5. Report domain model

| Field | Notes |
|-------|--------|
| `userId`, `governorateId`, `districtId` | Required refs |
| `category`, `description`, `locationDescription` | Text |
| `location` | GeoJSON `Point`, `[lng, lat]`; `2dsphere` index |
| `images` | Required array of URLs (≥1) |
| `status` | `PENDING` \| `IN_PROGRESS` \| `RESOLVED` \| `REJECTED` |
| `priority` | `LOW` \| `MEDIUM` \| `HIGH` \| `CRITICAL` |
| `departmentId` | Optional; list filter supports “unassigned” |
| `statusNote` | Optional; shown to citizen context; max length in schema |
| `duplicateReview` | `status`: `PENDING_REVIEW` \| `CONFIRMED_DUPLICATE` \| `NOT_DUPLICATE`; `primaryReportId` when confirmed |

Admin **PATCH** can update status, priority, status note, department, and duplicate actions. Status transitions can create **notifications** and optional **email** to the report owner.

### Duplicate linking consistency (server)

- **Ignore duplicate:** Clears current report’s duplicate review; if another report pointed to this one as primary under `CONFIRMED_DUPLICATE`, that link is cleared and review reset to pending.
- **Mark duplicate:** If the chosen primary had a reverse duplicate-of-this link, that stale state is cleared.

The system does **not** auto-delete reports, merge threads, or change status when marking duplicate unless the admin does so separately.

---

## 6. Duplicate candidate logic (suggestions only)

Candidates are computed for admin report detail; they are **not** automatic merges.

- Same `districtId` and same `category`
- `createdAt` within **±72 hours** of the current report
- **≤ 500 m** apart (Haversine on coordinates)
- Excludes the current report (`_id` not equal)
- Up to **25** recent DB matches before distance filter; results sorted by distance

---

## 7. Departments

- **List:** `GET /api/admin/departments` — active departments, sorted by name
- **Create:** `POST /api/admin/departments` — **SUPER_ADMIN** only; unique name enforced
- Reports assignable to an active department from admin detail

---

## 8. Comments

- **GET** `/api/reports/:id/comments`: requires auth. **Citizens:** may list comments for **any** report id (signed-in). **Admins:** may list when `adminCanAccessReport` allows that report.
- **POST** `/api/reports/:id/comments`: **citizens only** (not admins). Any citizen may add a comment on **any** report. The report owner receives an in-app **notification** when someone else comments (see `commentController.js`).

Citizen **report detail** UI (`/reports/:id`) is still limited to **own** reports for viewing the full report; commenting from other flows (e.g. public explore) depends on those pages calling the comments API with a valid token.

## 9. Notifications and email

### In-app

- Notifications created when admin updates drive status/note changes (see `adminReportController`)
- Citizen: list with pagination and optional unread filter; mark read endpoints

### Email (optional, env-driven)

- `EMAIL_NOTIFICATIONS_ENABLED`, SMTP vars, `MAIL_FROM`
- `EMAIL_PREVIEW_MODE` — log email without sending
- Typically tied to **status** changes (see `mailer.js` and controller)

---

## 10. Locations and seed data

- Governorates and districts via public API; Lebanon-oriented location seed (`backend/seedLebanonLocations.js`)
- Admins: `backend/seedAdmins.js` — optional super admin (`superadmin@local.test` in defaults), one **DISTRICT_ADMIN** per district; password via `SEED_ADMIN_PASSWORD` or project default; run after locations exist

---

## 11. API overview

| Area | Reference |
|------|-----------|
| Contract & auth rules | [API.md](./API.md) |
| Admin seeding / Compass | [mongodb-admins.md](./mongodb-admins.md) |

Public: `/api/health`, governorates, districts. Citizen and admin routes as mounted under `/api/auth`, `/api/reports`, `/api/admin`, `/api/notifications`, etc.

---

## 12. Local operations

- Backend: `backend/.env` — `MONGO_URI`, `JWT_SECRET`; default API `http://localhost:5000`
- Frontends: `REACT_APP_API_URL` if API base differs
- Ports: README suggests **admin-web** `3000`, **citizen-web** `3001`
- Windows: if `citizen-web` install fails, README documents sharing `node_modules` via junction from `admin-web`

---

## 13. Related documentation

- [API.md](./API.md) — HTTP contract
- [ARABIC-I18N.md](./ARABIC-I18N.md) — English/Arabic UI, RTL, locale files
- [mongodb-admins.md](./mongodb-admins.md) — admin accounts
- [README.md](../README.md) — run instructions and status wording

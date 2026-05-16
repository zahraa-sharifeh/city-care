# Smart City Issue Reporting — API contract

Base URL: `http://localhost:5000` (or `REACT_APP_API_URL` without trailing slash).

## Authentication

- **Header**: `Authorization: Bearer <JWT>`
- **Citizen JWT payload** (from `POST /api/auth/register` | `POST /api/auth/login`): `{ id, type: "citizen" }`
- **Admin JWT payload** (from `POST /api/admin/login`): `{ id, type: "admin", role: "SUPER_ADMIN" | "DISTRICT_ADMIN", districtId: ObjectId | null }`

## Public endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Liveness |
| GET | `/api/governorates` | All governorates (sorted by name) |
| GET | `/api/districts?governorateId=<id>` | Districts for a governorate |
| GET | `/api/districts/:districtId/spotlight` | District essay, heritage text, and events (public read; empty fields if not yet published) |
| GET | `/api/districts/:districtId/dashboard` | Public district KPI snapshot (report counts, top categories, avg resolution time) |
| GET | `/api/reports/public` | Paginated open reports (`PENDING` / `IN_PROGRESS` only); query: `page`, `limit`, optional `governorateId`, `districtId`, `category`, `sort` (`recent` default, `oldest`) |
| GET | `/api/reports/public/:id` | Single report for public read (no submitter id) |

## Citizen (`type: "citizen"`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | No | Body: `fullName`, `email`, `password`, optional `districtId` |
| POST | `/api/auth/login` | No | Body: `email`, `password` |
| POST | `/api/auth/google` | No | Body: `{ credential }` — Google Identity Services **ID token** (JWT). Verifies with server `GOOGLE_CLIENT_ID`; returns same `{ token, user }` shape as login when configured. Returns **503** if Google is not configured. |
| POST | `/api/reports` | Yes | `multipart/form-data`: fields + `images` (1–5 files) |
| GET | `/api/reports/mine` | Yes | Paginated list of current user’s reports |
| GET | `/api/reports/:id` | Yes | Report detail if **owner** |
| GET | `/api/reports/:id/comments` | Yes | List comments — any **citizen** (signed-in), or **admin** with report scope |
| POST | `/api/reports/:id/comments` | Yes | Body: `{ text }` — any **citizen** may comment on any report |
| GET | `/api/reports/:id/likes` | Optional | Like count; send Bearer token to include `likedByMe` for citizens |
| POST | `/api/reports/:id/likes` | Yes | Citizen only — toggles like on/off; returns `{ count, likedByMe }` |
| GET | `/api/reports/nearby-similar?districtId=<id>&category=<value>&lat=<n>&lng=<n>` | Yes | Nearby open reports in same district/category for duplicate prevention |
| GET | `/api/notifications` | Yes | Query: `page`, `limit`, optional `unreadOnly=true`, optional `status` |
| PATCH | `/api/notifications/:id/read` | Yes | Mark one notification as read |
| PATCH | `/api/notifications/read-all` | Yes | Mark all notifications as read |

### Create report (multipart)

Fields: `category`, `description`, `governorateId`, `districtId`, `locationDescription`, `lat`, `lng` + files field `images`.

## Admin (`type: "admin"`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/admin/login` | No | Body: `email`, `password` |
| PATCH | `/api/admin/me/password` | Yes | Body: `{ currentPassword, newPassword }` — updates logged-in admin’s password |
| GET | `/api/admin/reports` | Yes | Query: `status`, `districtId`, `page` (default 1), `limit` (default 20, max 100) |
| GET | `/api/admin/reports/:id` | Yes | Detail if visible under role scope |
| PATCH | `/api/admin/reports/:id` | Yes | Body: `{ status, statusNote? }` — `PENDING` \| `IN_PROGRESS` \| `RESOLVED` \| `REJECTED` |
| GET | `/api/admin/analytics` | Yes | Aggregated metrics for dashboards; optional `dateFrom`, `dateTo` |
| GET | `/api/admin/district-spotlight/:districtId` | Yes | Read editable district spotlight payload (same shape as public) |
| PUT | `/api/admin/district-spotlight/:districtId` | Yes | Body: `{ essay?, heritageInfo?, events? }` — upsert; max 25 events; each event: `title`, optional `summary`, `startsAt`, `venue`, `url` |

### Authorization rules (reports)

- **SUPER_ADMIN**: all reports; optional `districtId` query filter.
- **DISTRICT_ADMIN**: only reports where `report.districtId` equals JWT `districtId`. If JWT `districtId` is null, list/detail/update return **403**.

### Authorization rules (district spotlight)

- **SUPER_ADMIN**: can read and update spotlight for any district.
- **DISTRICT_ADMIN**: can read and update only for `districtId` matching JWT `districtId`; otherwise **403**.

## Error shape

JSON: `{ message: string }` (and optionally `error` in development from existing handlers).

## Status enum (reports)

`PENDING` | `IN_PROGRESS` | `RESOLVED` | `REJECTED`

## UI status labels

The API and database keep enum values above. Frontend UIs map them to friendly labels:

- `PENDING` → `Submitted`
- `IN_PROGRESS` → `In Progress`
- `RESOLVED` → `Resolved`
- `REJECTED` → `Rejected`

## Email notifications (optional)

When `EMAIL_NOTIFICATIONS_ENABLED=true`, backend sends an email to the report owner on status transitions.
Configure SMTP using: `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM`.
For local testing, set `EMAIL_PREVIEW_MODE=true` to print email subject/body in server logs without sending.

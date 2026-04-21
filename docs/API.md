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

## Citizen (`type: "citizen"`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | No | Body: `fullName`, `email`, `password`, optional `districtId` |
| POST | `/api/auth/login` | No | Body: `email`, `password` |
| POST | `/api/reports` | Yes | `multipart/form-data`: fields + `images` (1–5 files) |
| GET | `/api/reports/mine` | Yes | Paginated list of current user’s reports |
| GET | `/api/reports/:id` | Yes | Report detail if **owner** |
| GET | `/api/reports/:id/comments` | Yes | Comments if **owner** or **admin** with report scope |
| POST | `/api/reports/:id/comments` | Yes | Body: `{ text }` — only **report owner** |

### Create report (multipart)

Fields: `category`, `description`, `governorateId`, `districtId`, `locationDescription`, `lat`, `lng` + files field `images`.

## Admin (`type: "admin"`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/admin/login` | No | Body: `email`, `password` |
| PATCH | `/api/admin/me/password` | Yes | Body: `{ currentPassword, newPassword }` — updates logged-in admin’s password |
| GET | `/api/admin/reports` | Yes | Query: `status`, `districtId`, `page` (default 1), `limit` (default 20, max 100) |
| GET | `/api/admin/reports/:id` | Yes | Detail if visible under role scope |
| PATCH | `/api/admin/reports/:id` | Yes | Body: `{ status }` — `PENDING` \| `IN_PROGRESS` \| `RESOLVED` \| `REJECTED` |

### Authorization rules (reports)

- **SUPER_ADMIN**: all reports; optional `districtId` query filter.
- **DISTRICT_ADMIN**: only reports where `report.districtId` equals JWT `districtId`. If JWT `districtId` is null, list/detail/update return **403**.

## Error shape

JSON: `{ message: string }` (and optionally `error` in development from existing handlers).

## Status enum (reports)

`PENDING` | `IN_PROGRESS` | `RESOLVED` | `REJECTED`

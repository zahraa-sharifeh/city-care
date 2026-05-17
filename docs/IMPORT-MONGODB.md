# Imported MongoDB data not showing in the app

If you imported collections in Compass but the app shows **no reports**, it is usually one of these:

## 1. Wrong database (most common)

The API uses **`MONGO_URI`** (on Render/Railway/local `.env`). Compass must import into **that same database name**.

Example: if `MONGO_URI` ends with `/smart-city`, import into database **`smart-city`**, not `test` or `city-care`.

**Check:** Render → Environment → `MONGO_URI` → note the database name after the last `/`.

---

## 2. Collection names (lowercase)

Mongoose expects these collection names:

| Collection | Used for |
|------------|----------|
| `reports` | Issue reports |
| `users` | Citizens |
| `admins` | Admin logins |
| `governorates` | Location |
| `districts` | Location |
| `departments` | Optional |

Not `Reports`, `report`, or `reportscollections`.

---

## 3. District admin only sees their district

If you log in as **`DISTRICT_ADMIN`**, the API filters:

```js
{ districtId: <your admin's districtId> }
```

Imported reports with a **different** `districtId` (or wrong type) will **not appear**.

**Fix:** Log in as **super admin**:

- Email: `superadmin@local.test`
- Password: `ChangeMe123!` (after `npm run seed:admins`)

Or match report `districtId` to your admin’s `districtId` in the `admins` collection (same ObjectId).

---

## 4. Citizen home / map hides closed reports

Public lists only show **open** reports:

- `PENDING`
- `IN_PROGRESS`

Imported rows with **`RESOLVED`** or **`REJECTED`** do **not** show on Home / Map / Discover. They can still appear in **admin** → Reports (all statuses).

---

## 5. IDs must be ObjectId, not strings

JSON/Compass imports often store references as **strings**:

```json
"districtId": "674a1b2c3d4e5f6789012345"
```

The app queries with **ObjectId**. Those reports match **zero** filters.

**Fix:** Run the repair script from `backend/`:

```bash
cd backend
# .env must point to the SAME MONGO_URI as production
node scripts/fixImportedRefs.js --dry-run
node scripts/fixImportedRefs.js
```

---

## 6. Required report fields

Each document in `reports` should have:

```json
{
  "userId": ObjectId("..."),
  "governorateId": ObjectId("..."),
  "districtId": ObjectId("..."),
  "category": "Infrastructure & Roads",
  "description": "...",
  "locationDescription": "...",
  "location": {
    "type": "Point",
    "coordinates": [35.5018, 33.8938]
  },
  "images": ["/uploads/some-file.jpg"],
  "status": "PENDING",
  "priority": "MEDIUM",
  "duplicateReview": {
    "status": "PENDING_REVIEW",
    "primaryReportId": null
  }
}
```

Notes:

- `coordinates` are **`[longitude, latitude]`** (lng first).
- `images` must be a **non-empty** array (URLs or `/uploads/...` paths on the API server).
- `category` must match one of the 12 labels exactly (see `docs/TEST-DATA-CREATE-REPORT.md`).

---

## 7. Verify in Compass

1. Open the database from `MONGO_URI`.
2. `reports` → count documents.
3. Open one report → `districtId` should show type **ObjectId**.
4. `admins` → your login row → compare `districtId` with report’s `districtId`.

---

## 8. Verify API directly

Replace with your API URL:

```text
GET https://YOUR-API.onrender.com/api/health
```

After admin login (browser DevTools → Network → copy admin token):

```text
GET https://YOUR-API.onrender.com/api/admin/reports?page=1&limit=20
Authorization: Bearer <token>
```

If `total` is `0` here, the problem is data/scope/DB — not Netlify.

---

## Quick checklist

- [ ] Imported into the **same** DB as `MONGO_URI`
- [ ] Collection named **`reports`**
- [ ] Logged in as **super admin** OR report `districtId` matches admin
- [ ] Ran `node scripts/fixImportedRefs.js` if IDs were strings
- [ ] For citizen app: report `status` is `PENDING` or `IN_PROGRESS`
- [ ] `governorates` / `districts` / `users` imported and IDs line up with reports

# Project Defense — Q&A & Must-Know Guide

**Project:** Smart City Issue Reporting (City Care)  
**Purpose:** Citizens report urban issues with photos and GPS; municipal admins review, prioritize, and resolve them.  
**Stack:** React (citizen + admin) → Express REST API → MongoDB Atlas  

Use this document to prepare for oral questions. Pair it with [PROJECT-DEFENSE-PRESENTATION.md](./PROJECT-DEFENSE-PRESENTATION.md) for slide flow and demo script.

---

## 1. Elevator pitch (30 seconds)

> *City Care is a web platform for Lebanon that lets citizens submit civic issues — potholes, broken lights, waste — with photos and map coordinates. Each report is routed to the correct **governorate and district**. **District admins** see only reports in their area; a **super admin** oversees all districts. The system supports **Arabic and English**, **GPS auto-location**, **duplicate detection**, **public community feed**, **analytics**, and **in-app notifications**. It is deployed as two Netlify frontends and one Render API backed by MongoDB Atlas.*

---

## 2. Must-know facts (cheat sheet)

| Topic | What to say |
|-------|-------------|
| **Users** | Citizens (register/login) + Admins (`DISTRICT_ADMIN`, `SUPER_ADMIN`) |
| **Geography** | 8 governorates, 26 districts (Lebanon seed data) |
| **Issue categories** | 12 fixed categories (Infrastructure, Lighting, Water, Waste, Parks, Traffic, Buildings, Noise, Environment, Animals, Safety, Other) |
| **Report statuses** | `PENDING` → `IN_PROGRESS` → `RESOLVED` or `REJECTED` (UI: Submitted, In Progress, Resolved, Rejected) |
| **Priorities** | `LOW`, `MEDIUM`, `HIGH`, `CRITICAL` (admin sets) |
| **Auth** | JWT in `Authorization: Bearer` header; bcrypt passwords |
| **Maps** | Leaflet + OpenStreetMap tiles; coordinates stored as GeoJSON Point `[lng, lat]` |
| **Images** | 1–5 per report; Multer upload; served from `/uploads` |
| **Deployment** | Citizen + Admin on Netlify; API on Render; DB on MongoDB Atlas |
| **Languages** | English + Arabic (i18next); RTL layout for Arabic |

**Production URLs (demo):**

- Citizen: `https://citycarelb.netlify.app`
- Admin: `https://citycareadminlb.netlify.app`
- API health: `https://city-care-7ygl.onrender.com/api/health`

---

## 3. Features you must explain

### 3.1 Citizen app

| Feature | What it does | How it works (technical) |
|---------|--------------|---------------------------|
| **Register / Login** | Account creation | `POST /api/auth/register`, `POST /api/auth/login`; JWT returned |
| **Google Sign-In** | Optional OAuth | Frontend sends Google ID token → `POST /api/auth/google`; server verifies with `GOOGLE_CLIENT_ID` |
| **Create report** | Submit issue | Multipart form: category, description, gov/district, lat/lng, 1–5 images |
| **Use GPS** | Auto-fill location | Browser `navigator.geolocation` → pin on Leaflet map → `GET /api/location/from-coordinates` |
| **Nearby similar warning** | Avoid duplicates | While creating, `GET /api/reports/nearby-similar` shows open reports within 500 m, same district/category |
| **My reports** | Track own submissions | `GET /api/reports/mine` (paginated) |
| **Report detail** | View status + history | Owner-only `GET /api/reports/:id` |
| **Notifications** | Status updates, comments, likes | `GET /api/notifications`; badge polls every 30 s |
| **Public home feed** | Community transparency | `GET /api/reports/public` — open reports without login |
| **Map page** | See issues on map | Leaflet markers from public API |
| **Discover** | Civic content per district | Essay, heritage, events via `GET /api/districts/:id/spotlight` |
| **Explore report** | Public detail + social | Likes (optional auth); comments require login |
| **Arabic / English** | Bilingual UI | i18next; `dir="rtl"` when Arabic selected |

### 3.2 Admin app

| Feature | What it does | How it works (technical) |
|---------|--------------|---------------------------|
| **District-scoped access** | Admins see their district only | JWT contains `districtId`; `reportAccess.js` enforces match |
| **Reports list** | Filter + paginate | Status, priority, category, department, date range; map view |
| **Report detail** | Triage | Update status, priority, status note, department |
| **Duplicate review** | Link related reports | Server suggests candidates; admin marks duplicate or not |
| **Analytics** | KPIs + charts | `GET /api/admin/analytics` — totals, breakdowns, daily trend |
| **District spotlight** | Edit civic content | Essay, heritage, events (max 25) per district |
| **PDF export** | Print/share reports | Server generates PDF via pdfkit |
| **Departments** | Assign work units | Super admin creates; admin assigns to reports |

### 3.3 Backend highlights

| Area | Detail |
|------|--------|
| **REST API** | Express 5; routes under `/api/auth`, `/api/reports`, `/api/admin`, etc. |
| **Database** | Mongoose models: User, Admin, Report, Comment, Notification, Department, Governorate, District, DistrictSpotlight, ReportLike |
| **Geospatial** | Report `location` field: GeoJSON Point with `2dsphere` index |
| **Reverse geocoding** | Nominatim (OpenStreetMap) + DB name matching + nearest-district fallback when cloud host blocks OSM |
| **Rate limiting** | Auth endpoints, admin login, report creation throttled |
| **Email (optional)** | SMTP on status change; `EMAIL_PREVIEW_MODE` for local testing |

---

## 4. Architecture questions

### Q: Describe your system architecture.

**Answer:** Three-tier architecture. Two **React single-page applications** (citizen and admin) talk to one **Express REST API**. The API uses **Mongoose** to read/write **MongoDB**. Uploaded images are stored on the API server filesystem under `/uploads`. In production, frontends are static builds on **Netlify**; the API runs on **Render**; the database is **MongoDB Atlas**. Communication is HTTPS with JWT authentication and CORS restricted to the two frontend URLs.

### Q: Why two separate React apps instead of one?

**Answer:** Citizens and admins have different workflows, navigation, and security boundaries. Splitting apps keeps the citizen bundle smaller, allows separate deployment URLs, and makes role separation clearer — admins never share the citizen login page.

### Q: Why MongoDB instead of SQL?

**Answer:** Report documents combine text, arrays (images), nested duplicate-review state, and **GeoJSON coordinates** with a geospatial index. MongoDB fits this document model and supports `$geoNear`-style queries. Lebanon’s governorate/district hierarchy is also stored as related collections.

### Q: Why Express and not NestJS / Django?

**Answer:** Express is lightweight and matches the project scope: REST endpoints, middleware for auth and uploads, and clear separation into controllers, services, and models. It integrates well with Mongoose and Multer without extra framework overhead.

### Q: How does the frontend know which API to call?

**Answer:** Environment variable `REACT_APP_API_URL` at build time (Netlify env vars). Locally it defaults to `http://localhost:5000`.

---

## 5. Security & access control questions

### Q: How do you authenticate users?

**Answer:** On login/register, the server returns a **JWT**. The client stores it (localStorage) and sends `Authorization: Bearer <token>` on protected requests. Middleware `auth.js` verifies the token and attaches user/admin identity to the request.

### Q: How do you authorize district admins?

**Answer:** Admin JWT includes `role` and `districtId`. For report list/detail/update, the server compares `report.districtId` to the admin’s `districtId`. Mismatch → **403 Forbidden**. Super admins bypass district filter unless they choose to filter.

### Q: Can a citizen view another citizen’s private report?

**Answer:** No. `GET /api/reports/:id` returns detail only if the authenticated citizen is the **owner**. Public explore uses a separate endpoint that strips sensitive fields (e.g. submitter identity).

### Q: How are passwords stored?

**Answer:** **bcrypt** with cost factor 10. Plain passwords never stored. Password policy: minimum 8 characters, uppercase, lowercase, and digit.

### Q: What attacks did you consider?

**Answer:**

| Threat | Mitigation |
|--------|------------|
| Brute-force login | Rate limiting on auth routes |
| IDOR (access others’ reports) | Owner check + district scope in `reportAccess.js` |
| XSS in emails | HTML escaping in mailer |
| Malicious uploads | Image MIME/extension filter, 5 MB limit, sanitized filenames |
| Token theft | HTTPS in production; JWT expiry (`JWT_EXPIRES_IN`, e.g. 7 days) |

### Q: What are your security limitations?

**Answer (be honest):** JWT in localStorage is vulnerable to XSS if the app were compromised — httpOnly cookies would be stronger. Uploaded files on Render free tier are on ephemeral disk (not ideal for production). No 2FA. Google OAuth depends on correct client ID configuration.

---

## 6. Geolocation & GPS questions

### Q: How does GPS work in your app?

**Answer:** The app does **not** talk to GPS hardware directly. It uses the browser **Geolocation API** (`navigator.geolocation.getCurrentPosition`). The OS combines GPS, Wi‑Fi, or cell data and returns latitude/longitude. The user must grant permission. On success, the pin moves on a **Leaflet** map and the backend reverse-geocodes to governorate/district.

### Q: What is reverse geocoding?

**Answer:** Converting lat/lng → place names. Our API calls **Nominatim** (OpenStreetMap), then matches returned text to our seeded district names using normalization and aliases. If Nominatim fails from the cloud server, we fall back to **nearest district centroid** (Haversine distance to 26 district centers).

### Q: Why did GPS fail on mobile in production?

**Answer:** Nominatim often blocks or rate-limits cloud server IPs (Render). The old code returned 404 when Nominatim failed. The fix adds retries, proper User-Agent, and nearest-district fallback so valid Lebanon coordinates still resolve.

### Q: How are coordinates stored?

**Answer:** GeoJSON: `{ type: "Point", coordinates: [longitude, latitude] }` with a **2dsphere** index for geospatial queries (duplicate detection, nearby similar).

### Q: Can someone submit a report outside Lebanon?

**Answer:** The API checks a rough Lebanon bounding box on reverse lookup. Client validates numeric lat/lng ranges. A user could still manually pick a district — business rule is trust + admin review.

---

## 7. Duplicate detection questions

### Q: How do you detect duplicates?

**Answer:** Two layers:

1. **Citizen (preventive):** While creating a report, the API finds open reports in the **same district and category**, created within **±72 hours**, within **500 meters** (Haversine).
2. **Admin (review):** Same logic suggests candidates on report detail. Admin can **Mark duplicate** (links to primary report) or **Mark as not duplicate**.

### Q: Does the system auto-merge duplicates?

**Answer:** **No.** Suggestions only. Admin decides. Marking duplicate updates `duplicateReview` fields; it does not delete reports or auto-change status.

### Q: Why 500 meters and 72 hours?

**Answer:** Practical civic scale: same pothole reported twice nearby within a few days. Values are configurable constants in `duplicateDetection.js`. I chose them to balance false positives vs. missing real duplicates.

---

## 8. Arabic / i18n questions

### Q: How is Arabic supported?

**Answer:** **i18next** + **react-i18next** in both apps. Translation files: `en.json` and `ar.json` (~470+ keys each). On language change, `document.documentElement.dir` becomes `rtl` for Arabic. Choice persists in `localStorage` (`citycare_lang` / `citycare_admin_lang`).

### Q: Is the backend in Arabic?

**Answer:** Mostly **English** — API messages, stored category enum values, PDF export. Arabic is a **frontend presentation layer**. This keeps one API contract and lets us add languages without backend changes.

### Q: What challenges did RTL cause?

**Answer:** Layout mirroring (nav, forms, map controls), text alignment, and mixed LTR content (URLs, numbers). CSS uses logical properties and RTL-specific overrides in `mobile.css` and page styles.

---

## 9. Database design questions

### Q: Main collections?

**Answer:**

| Collection | Key fields |
|------------|------------|
| **User** | email, password hash, fullName, optional districtId, optional googleId |
| **Admin** | email, password hash, role, districtId |
| **Report** | userId, governorateId, districtId, category, description, location (GeoJSON), images[], status, priority, departmentId, duplicateReview |
| **Comment** | reportId, userId, text |
| **Notification** | userId, type, reportId, read flag |
| **Governorate / District** | name; district refs governorate |
| **DistrictSpotlight** | districtId, essay, heritageInfo, events[] |
| **Department** | name, active flag |
| **ReportLike** | reportId, userId |

### Q: Relationships?

**Answer:** Reports reference User, Governorate, District, optional Department. Comments and notifications reference Report and User. Admins reference one District (except super admin may have null districtId).

---

## 10. Notifications & email

### Q: When does a citizen get notified?

**Answer:**

| Event | Channel |
|-------|---------|
| Admin changes report status | In-app notification (+ optional email if SMTP enabled) |
| Someone comments on their report | In-app |
| Someone likes their report | In-app |

### Q: How does email work?

**Answer:** Optional, env-driven (`EMAIL_NOTIFICATIONS_ENABLED`, SMTP vars). `EMAIL_PREVIEW_MODE=true` logs email to console without sending — useful for demo.

---

## 11. Deployment & operations

### Q: How is the project deployed?

**Answer:**

```
Citizen (Netlify) ──┐
                    ├──► Render API ──► MongoDB Atlas
Admin (Netlify) ────┘
```

- Build: `npm run build` per React app; `npm install` + `npm start` for API
- CORS: `CORS_ORIGIN` lists both Netlify URLs
- Seeds: `seedLebanonLocations.js`, `seedAdmins.js` (one admin per district)

### Q: Limitations of free hosting?

**Answer:** Render free tier **sleeps** on inactivity (cold start ~30 s). **Ephemeral disk** — uploaded images may disappear on redeploy. Fine for thesis demo; production would use S3/Cloudinary and paid tier.

---

## 12. Evaluation & methodology questions

### Q: How did you evaluate the system?

**Suggested answer (adapt to what you actually did):**

- **Functional testing:** End-to-end flows (register → create report → admin resolves)
- **Usability:** Task scenarios (submit report with GPS, admin change status) + optional **SUS questionnaire**
- **Technical validation:** API tests, geolocation edge cases, district scoping (403 for wrong admin)
- **Deployment test:** Production URLs on mobile and desktop

If you did not run formal user studies, say: *"Primary evaluation was scenario-based testing with [N] pilot users / self-testing against requirements."*

### Q: What are limitations of your project?

**Answer:**

- Web-only (no native mobile app)
- No push notifications (polling only)
- File storage not cloud-backed on free tier
- Geocoding depends on third-party OSM / fallback centroids
- No integration with real municipal ticketing systems
- Comment moderation is minimal

### Q: Future work?

**Answer:** Cloud image storage (S3), push notifications, native mobile app, SMS alerts, admin comment replies, automated routing to departments by category, integration with municipal GIS, stronger auth (httpOnly cookies, 2FA).

---

## 13. Common doctor questions — quick answers

| Question | Short answer |
|----------|--------------|
| **What problem does this solve?** | Citizens lack an easy channel to report local issues; municipalities lack structured, geolocated data. |
| **Who is your target user?** | Lebanese citizens + municipal district administrators. |
| **What is novel?** | Lebanon-specific admin geography, bilingual civic UX, duplicate-aware workflow, public transparency feed + district spotlight. |
| **Why Lebanon districts?** | Reports must reach the correct local admin; seed data matches Lebanese mohafazat/qadaa structure. |
| **REST or GraphQL?** | REST — simpler for this scope, easy to document, works well with multipart uploads. |
| **Why JWT?** | Stateless API; works across two SPAs and Render serverless-style hosting. |
| **What is Leaflet?** | Open-source JS map library using OSM tiles — free, no Google Maps API key required. |
| **What is Multer?** | Express middleware for `multipart/form-data` file uploads. |
| **What is Mongoose?** | ODM for MongoDB — schemas, validation, population of refs. |
| **Super admin vs district admin?** | Super sees all districts, creates departments; district admin sees one district only. |
| **Can admin create reports?** | No — admins review citizen submissions only. |
| **What happens when report is REJECTED?** | Citizen sees status + optional status note; notification sent. |
| **Public feed privacy?** | No citizen name/email on public endpoints; only category, location area, description, status. |
| **How long did development take?** | *[Fill in your timeline]* |
| **What was hardest?** | GPS/reverse geocoding on production servers; RTL layout; district-scoped admin analytics. |
| **Did you use AI?** | *[Answer honestly per your university policy]* |

---

## 14. Demo credentials & test data

Prepare before defense:

- [ ] One **citizen** account (your email)
- [ ] One **district admin** from `seedAdmins.js` (e.g. Beirut admin)
- [ ] Optional **super admin** (`superadmin@local.test` if seeded)
- [ ] At least one **existing report** with images for admin demo
- [ ] Know your **seed admin password** (`SEED_ADMIN_PASSWORD` or default from seed script)

See [TEST-DATA-CREATE-REPORT.md](./TEST-DATA-CREATE-REPORT.md) for sample report content.

---

## 15. If you get stuck during Q&A

1. **Repeat the question** — buys time, shows listening.
2. **Separate what you built vs. what you would improve** — "Currently X; with more time I would Y."
3. **Refer to architecture** — "That logic lives in the backend service layer, not the UI."
4. **Never invent features** — if unsure, say: *"I'm not certain of that edge case; I would verify in the code / test it."*
5. **Use the docs** — [FEATURES-REPORT.md](./FEATURES-REPORT.md), [API.md](./API.md), [GEOLOCATION.md](./GEOLOCATION.md), [ARABIC-I18N.md](./ARABIC-I18N.md).

---

## 16. Related documentation

| Document | Use for |
|----------|---------|
| [FEATURES-REPORT.md](./FEATURES-REPORT.md) | Full feature list |
| [API.md](./API.md) | Endpoint details |
| [GEOLOCATION.md](./GEOLOCATION.md) | GPS deep dive |
| [ARABIC-I18N.md](./ARABIC-I18N.md) | Arabic integration |
| [DEPLOY-NETLIFY.md](./DEPLOY-NETLIFY.md) | Deployment |
| [PROJECT-DEFENSE-PRESENTATION.md](./PROJECT-DEFENSE-PRESENTATION.md) | Slides & demo flow |

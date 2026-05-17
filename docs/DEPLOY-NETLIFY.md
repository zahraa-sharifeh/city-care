# Deploy on Netlify (frontends) + hosted API

Netlify hosts the **React** apps. The **Express API** and **MongoDB** run on another host — **no MongoDB Atlas required**.

This guide uses **[Railway](https://railway.app)** for MongoDB + API (free trial credits, simple setup). Alternatives: API on **Render** + MongoDB on **Railway**, or **Docker** on your own VPS.

## Architecture

| Component    | Host              | Example URL                          |
|-------------|-------------------|--------------------------------------|
| Citizen app | Netlify site #1   | `https://citycare-citizen.netlify.app` |
| Admin app   | Netlify site #2   | `https://citycare-admin.netlify.app`   |
| API         | Render Web Service| `https://citycare-api.onrender.com`    |
| Database    | MongoDB Atlas     | connection string in `MONGO_URI`     |

---

## 1. MongoDB Atlas

1. Create a free cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas).
2. **Database Access** → add a user with password.
3. **Network Access** → allow `0.0.0.0/0` (or Render’s IPs) for development/demo.
4. **Connect** → copy the connection string and set database name, e.g.  
   `mongodb+srv://USER:PASS@cluster.mongodb.net/smart-city?retryWrites=true&w=majority`

---

## 2. Deploy the API (Render)

1. Push this repo to GitHub/GitLab (includes `render.yaml` with correct commands).
2. [render.com](https://render.com) → **New** → **Web Service** → connect the repo.
3. Settings (**important — not `npm build`**):

   | Field | Value |
   |-------|--------|
   | **Root directory** | `backend` |
   | **Build command** | `npm install` |
   | **Start command** | `npm start` |
   | **Instance type** | Free |

   The backend has **no** `build` script. Using `npm build` or `npm run build` will fail with `Unknown command: "build"`.
4. **Environment** variables:

   | Key | Value |
   |-----|--------|
   | `MONGO_URI` | Atlas connection string |
   | `JWT_SECRET` | long random string |
   | `JWT_EXPIRES_IN` | `7d` |
   | `CORS_ORIGIN` | Your two Netlify URLs, comma-separated (set after step 3) |
   | `GOOGLE_CLIENT_ID` | optional, same as citizen web |
   | `NODE_VERSION` | `20` (if offered) |

5. After deploy, open `https://YOUR-SERVICE.onrender.com/api/health` — should return `{ "status": "ok", ... }`.
6. **Shell** (Render dashboard) or run locally against Atlas:

   ```bash
   cd backend
   npm run seed:locations
   npm run seed:admins
   ```

**Note:** Render free disk is ephemeral. Uploaded report images in `backend/uploads` may be lost on redeploy. For a thesis demo this is often acceptable; for production use S3/Cloudinary.

---

## 3. Netlify — citizen-web

1. [app.netlify.com](https://app.netlify.com) → **Add new site** → **Import an existing project**.
2. Connect the same Git repo.
3. **Site configuration:**
   - **Base directory:** `citizen-web`
   - **Build command:** `npm run build` (or leave empty — `netlify.toml` sets it)
   - **Publish directory:** `citizen-web/build` (or `build` relative to base)
4. **Environment variables** (Site settings → Environment variables):

   | Key | Value |
   |-----|--------|
   | `REACT_APP_API_URL` | `https://YOUR-SERVICE.onrender.com` (no trailing slash) |
   | `REACT_APP_GOOGLE_CLIENT_ID` | optional |

5. **Deploy site**. Note the URL (e.g. `https://something.netlify.app`).

`citizen-web/netlify.toml` already configures Node 20 and SPA redirects for React Router.

---

## 4. Netlify — admin-web

Repeat step 3 with a **second** Netlify site:

- **Base directory:** `admin-web`
- **Publish directory:** `build`
- **Environment variables:**

   | Key | Value |
   |-----|--------|
   | `REACT_APP_API_URL` | same API URL as citizen |

Deploy and note the admin URL.

---

## 5. Finish API CORS

In Render, set **`CORS_ORIGIN`** to both Netlify URLs (no trailing slashes):

```text
https://your-citizen.netlify.app,https://your-admin.netlify.app
```

Redeploy or restart the API service if needed.

---

## 6. Google Sign-In (optional)

If you use Google login on citizen-web:

1. [Google Cloud Console](https://console.cloud.google.com/) → OAuth client → **Authorized JavaScript origins**:
   - `https://your-citizen.netlify.app`
2. Use the same client ID in:
   - Netlify `REACT_APP_GOOGLE_CLIENT_ID`
   - Render `GOOGLE_CLIENT_ID`

---

## 7. Custom domains (optional)

In each Netlify site: **Domain management** → add your domain → update DNS as instructed.

Update `CORS_ORIGIN` and Google OAuth origins to match custom domains.

---

## Deploy from CLI (optional)

Install [Netlify CLI](https://docs.netlify.com/cli/get-started/), then from repo root:

```bash
# Citizen
cd citizen-web
npm run build
npx netlify deploy --prod --dir=build

# Admin (separate site — link each folder to its own Netlify site first)
cd ../admin-web
npm run build
npx netlify deploy --prod --dir=build
```

Set `REACT_APP_API_URL` in the Netlify UI before building, or pass at build time:

```bash
REACT_APP_API_URL=https://your-api.onrender.com npm run build
```

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Render `Unknown command: "build"` | Build command must be **`npm install`**, not `npm build` |
| Blank page after refresh on `/reports/123` | SPA redirect — `netlify.toml` `/* → /index.html` |
| API calls fail / CORS error | Set `CORS_ORIGIN` on API to exact Netlify URLs; rebuild frontends with correct `REACT_APP_API_URL` |
| `REACT_APP_*` ignored | Vars must be set **before** build on Netlify; trigger **Clear cache and deploy** |
| Images 404 on reports | API uploads lost on Render redeploy — re-upload or use persistent storage |
| Admin login works locally only | Check `REACT_APP_API_URL` on admin Netlify site |

---

## Imported data not visible

If you imported `reports` (or other collections) in Compass but the app is empty, see **[IMPORT-MONGODB.md](./IMPORT-MONGODB.md)**. Common causes: wrong database name in `MONGO_URI`, district-admin filter, string IDs instead of ObjectId, or citizen app hiding `RESOLVED` reports.

Run on the production URI (from your laptop):

```bash
cd backend
node scripts/fixImportedRefs.js --dry-run
node scripts/fixImportedRefs.js
```

---

## Admin login: “Invalid credentials”

That message means the API is reachable but **no admin matches** that email/password in the **production** database (or the password is wrong).

### Default accounts (after seeding)

Run seeds against the **same** `MONGO_URI` your Render service uses:

```bash
cd backend
# In .env set MONGO_URI to your production Mongo URL (Railway, Atlas, etc.)
npm run seed:locations
npm run seed:admins
```

Then sign in on **admin-web** with:

| Field | Value |
|-------|--------|
| **Email** | `superadmin@local.test` |
| **Password** | `ChangeMe123!` (unless you set `SEED_ADMIN_PASSWORD` in `.env` when seeding) |

District admins use emails like `admin.north.tripoli@local.test` — same password. See [mongodb-admins.md](./mongodb-admins.md).

### Checklist if login still fails

1. **Netlify** `REACT_APP_API_URL` = your Render URL (test `https://YOUR-API.onrender.com/api/health` in the browser).
2. **Render** `MONGO_URI` is the database you ran seeds on (not a different empty DB).
3. Seeds completed without errors (`seed:locations` before `seed:admins`).
4. Email is lowercase (`superadmin@local.test`), not a **citizen** account from citizen-web.
5. On Render **Logs**, confirm Mongo connected on startup (no `MONGO_URI` errors).

---

## Quick checklist

- [ ] MongoDB + `MONGO_URI` on Render
- [ ] Render API live + `/api/health` OK
- [ ] Seeds run (`seed:locations`, `seed:admins`)
- [ ] Citizen Netlify site + `REACT_APP_API_URL`
- [ ] Admin Netlify site + `REACT_APP_API_URL`
- [ ] `CORS_ORIGIN` lists both Netlify URLs
- [ ] Test register/login on citizen URL and admin login on admin URL

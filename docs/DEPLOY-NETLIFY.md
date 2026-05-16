# Deploy on Netlify (frontends) + hosted API & MongoDB

Netlify hosts the **React** apps. The **Express API** and **MongoDB** run on another host — **no MongoDB Atlas required**.

This guide uses **[Railway](https://railway.app)** for MongoDB + API (free trial credits, simple setup). Alternatives: API on **Render** + MongoDB on **Railway**, or **Docker** on your own VPS.

## Architecture

| Component    | Host              | Example URL                          |
|-------------|-------------------|--------------------------------------|
| Citizen app | Netlify site #1   | `https://citycare-citizen.netlify.app` |
| Admin app   | Netlify site #2   | `https://citycare-admin.netlify.app`   |
| API         | Railway service   | `https://citycare-api.up.railway.app`  |
| Database    | Railway MongoDB   | private URL → `MONGO_URI` on API     |

---

## 1. Railway — MongoDB + API (recommended)

### 1a. Create project & MongoDB

1. Sign in at [railway.app](https://railway.app) and **New Project**.
2. **Add service** → **Database** → **MongoDB** (or **Empty Service** → deploy MongoDB template).
3. Open the MongoDB service → **Variables** or **Connect** tab.
4. Copy the connection URL (often `MONGO_URL` or `MONGO_PUBLIC_URL`).  
   If the URL has no database name, append `/smart-city`, e.g.  
   `mongodb://user:pass@host:port/smart-city`

### 1b. Deploy the API from GitHub

1. In the same project: **Add service** → **GitHub Repo** → select this repository.
2. Service settings:
   - **Root directory:** `backend`
   - **Start command:** `npm start` (Railway runs `npm install` automatically)
3. **Variables** on the **API** service:

   | Key | Value |
   |-----|--------|
   | `MONGO_URI` | Paste Mongo URL from step 1a (with `/smart-city`) **or** reference `${{MongoDB.MONGO_URL}}` and add `?authSource=admin` / db name as Railway docs show |
   | `JWT_SECRET` | long random string |
   | `JWT_EXPIRES_IN` | `7d` |
   | `CORS_ORIGIN` | Set after Netlify deploy (step 3) — both frontend URLs, comma-separated |
   | `GOOGLE_CLIENT_ID` | optional |
   | `PORT` | Railway sets this automatically — leave unset or use `${{PORT}}` |

   **Tip:** In Railway, use **Variable Reference** from the MongoDB service → `MONGO_URL`, then in `MONGO_URI` ensure the path ends with `/smart-city`.

4. **Settings** → **Networking** → **Generate domain** for the API (public HTTPS URL).
5. Open `https://YOUR-API.up.railway.app/api/health` — expect `{ "status": "ok", ... }`.

### 1c. Seed data

From your machine (with Railway CLI) or Railway **Shell** on the API service:

```bash
# Install CLI: npm i -g @railway/cli
railway login
cd backend
railway link   # pick your project + API service
railway run npm run seed:locations
railway run npm run seed:admins
```

Or run seeds **locally** once, pointing at the Railway Mongo URL:

```bash
cd backend
# .env with MONGO_URI=<railway-mongo-url>/smart-city
npm run seed:locations
npm run seed:admins
```

**Uploads:** Railway volumes can be attached for `backend/uploads` if you need persistent images; on the default setup, images may reset on redeploy (OK for demos).

---

## 2. Netlify — citizen-web

1. [app.netlify.com](https://app.netlify.com) → **Add new site** → import your Git repo.
2. **Site configuration:**
   - **Base directory:** `citizen-web`
   - **Build command:** `npm run build`
   - **Publish directory:** `build`
3. **Environment variables:**

   | Key | Value |
   |-----|--------|
   | `REACT_APP_API_URL` | `https://YOUR-API.up.railway.app` (no trailing slash) |
   | `REACT_APP_GOOGLE_CLIENT_ID` | optional |

4. Deploy and copy the site URL.

`citizen-web/netlify.toml` configures Node 20 and SPA redirects.

---

## 3. Netlify — admin-web

Create a **second** Netlify site:

- **Base directory:** `admin-web`
- **Publish directory:** `build`
- **`REACT_APP_API_URL`:** same Railway API URL as citizen

Deploy and copy the admin URL.

---

## 4. API CORS

On the Railway **API** service, set:

```text
CORS_ORIGIN=https://your-citizen.netlify.app,https://your-admin.netlify.app
```

Redeploy if the service does not pick up changes automatically.

---

## 5. Google Sign-In (optional)

1. [Google Cloud Console](https://console.cloud.google.com/) → OAuth **Web client** → **Authorized JavaScript origins:**
   - `https://your-citizen.netlify.app`
2. Same client ID in Netlify `REACT_APP_GOOGLE_CLIENT_ID` and Railway `GOOGLE_CLIENT_ID`.

---

## Alternative A — Render API + Railway Mongo only

If you prefer **Render** for the API but still **no Atlas**:

1. Add **MongoDB on Railway** (section 1a) and copy `MONGO_URI`.
2. Deploy **backend** on [Render](https://render.com) (root `backend`, start `npm start`).
3. Set `MONGO_URI` to the Railway Mongo connection string.
4. Netlify steps unchanged; use the Render URL in `REACT_APP_API_URL`.

---

## Alternative B — Docker on a VPS (self-hosted MongoDB)

For a small VPS (Hetzner, DigitalOcean, etc.) with **no Atlas and no Railway**:

1. Install Docker on the server.
2. From repo root:

   ```bash
   cp backend/.env.example backend/.env
   # Edit JWT_SECRET; MONGO_URI is set by compose for local mongo
   docker compose up -d
   ```

3. Open port `5000` (or put **Caddy/nginx** in front with HTTPS).
4. Point Netlify `REACT_APP_API_URL` to `https://your-server:5000` or your API domain.
5. Set `CORS_ORIGIN` in `backend/.env` to your Netlify URLs.

Files: `docker-compose.yml` and `backend/Dockerfile` in this repo.

---

## Deploy from CLI (optional)

```bash
cd citizen-web
REACT_APP_API_URL=https://YOUR-API.up.railway.app npm run build
npx netlify deploy --prod --dir=build
```

Repeat for `admin-web` on a linked second Netlify site.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `MongoServerError` / connection refused | Check `MONGO_URI` includes correct host, user, password, and `/smart-city` |
| CORS error | `CORS_ORIGIN` must match Netlify URLs exactly (https, no trailing slash) |
| `REACT_APP_*` ignored | Set on Netlify before build → **Clear cache and deploy** |
| API 502 on Railway | Check deploy logs; ensure `npm start` and `connectDB` succeed |
| Blank page on refresh | `netlify.toml` SPA redirect `/* → /index.html` |
| Images missing after redeploy | Use Railway volume for `uploads` or re-upload test images |

---

## Quick checklist

- [ ] Railway MongoDB service running
- [ ] Railway API live + `/api/health` OK
- [ ] `MONGO_URI` + `JWT_SECRET` set on API
- [ ] Seeds run (`seed:locations`, `seed:admins`)
- [ ] Citizen Netlify + `REACT_APP_API_URL`
- [ ] Admin Netlify + `REACT_APP_API_URL`
- [ ] `CORS_ORIGIN` = both Netlify URLs
- [ ] Test citizen register + admin login

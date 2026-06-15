# Project Defense — Presentation Guide

**Project:** Smart City Issue Reporting (City Care)  
**Suggested duration:** 12–18 minutes presentation + 5–10 minutes Q&A  
**Format:** Slides + live demo (recommended)

Pair this guide with [PROJECT-DEFENSE-QA.md](./PROJECT-DEFENSE-QA.md) for anticipated questions and technical answers.

---

## 1. Presentation strategy

### Goals

1. **Problem first** — why civic reporting matters in Lebanon  
2. **Solution overview** — what you built in one sentence  
3. **Architecture** — prove you understand the full stack  
4. **Live demo** — show the happy path (citizen → admin)  
5. **Highlight differentiators** — Arabic, GPS, duplicates, analytics  
6. **Honest limits + future work** — shows maturity  

### Recommended split

| Section | Time | Method |
|---------|------|--------|
| Introduction & problem | 2 min | Slides |
| Requirements & roles | 1 min | Slides |
| Architecture & tech stack | 2–3 min | Slide (diagram) |
| Key features overview | 2 min | Slides |
| **Live demo** | 5–7 min | Browser (citizen + admin) |
| Security & data design | 1–2 min | Slides |
| Evaluation / results | 1–2 min | Slides |
| Conclusion & future work | 1 min | Slides |
| Q&A | 5–10 min | Oral |

### Presentation tips

- **Open confidently:** state the project name, your name, and one-line purpose before clicking anything.  
- **Demo second screen:** use presenter mode or phone as timer; keep demo tabs pre-open.  
- **Tell → Show → Tell:** announce what you will do, do it, summarize what happened.  
- **Slow down on GPS and Arabic** — these are impressive; don’t rush.  
- **If demo fails:** switch to screenshots (prepare appendix slides) and explain the flow verbally.  
- **End with impact:** “Citizens can report in Arabic with one tap on GPS; admins get structured, map-based triage.”  

---

## 2. Recommended slide deck (18 slides)

Use PowerPoint, Google Slides, or Canva. Keep text minimal — **6 bullets max per slide**.

---

### Slide 1 — Title

**Title:** City Care — Smart City Issue Reporting Platform  
**Subtitle:** [Your Name] · [University / Department] · [Date]  
**Visual:** App logo or screenshot of home page  

**Say:**  
> *Good [morning/afternoon]. I present City Care, a bilingual web platform where Lebanese citizens report urban issues and municipal admins manage them with map-based tools and analytics.*

---

### Slide 2 — Problem & motivation

**Title:** The Problem  

**Bullets:**

- Citizens see potholes, broken lights, waste — no simple digital channel  
- Municipalities receive unstructured calls/messages — hard to track and prioritize  
- Need: **geolocated**, **photo-backed**, **district-routed** reports  
- Lebanon context: **8 governorates**, **26 districts** — routing must match admin structure  

**Say:**  
> *Urban issues are visible every day, but reporting is often informal. My system gives citizens a structured channel and gives each district admin a focused inbox.*

---

### Slide 3 — Objectives

**Title:** Project Objectives  

**Bullets:**

1. Allow citizens to submit issues with **photos + GPS**  
2. Route reports to correct **governorate/district**  
3. Enable **district admins** to triage, prioritize, and resolve  
4. Provide **transparency** via public feed and district discover page  
5. Support **Arabic and English** for accessibility  

---

### Slide 4 — Users & roles

**Title:** Actors & Roles  

**Table or diagram:**

| Role | Can do |
|------|--------|
| **Citizen** | Register, submit reports, track status, comment/like public reports |
| **District Admin** | Manage reports **in their district only** |
| **Super Admin** | All districts, analytics, create departments |

**Visual:** Simple role diagram (Citizen → API ← Admin)

---

### Slide 5 — System architecture

**Title:** Architecture  

**Diagram (use this):**

```
┌──────────────────┐     ┌──────────────────┐
│   citizen-web    │     │    admin-web     │
│   React (Netlify)│     │  React (Netlify) │
└────────┬─────────┘     └────────┬─────────┘
         │    HTTPS + JWT         │
         └──────────┬─────────────┘
                    ▼
         ┌──────────────────────┐
         │   Express REST API   │
         │   (Render)           │
         └──────────┬───────────┘
                    ▼
         ┌──────────────────────┐
         │   MongoDB Atlas      │
         └──────────────────────┘
```

**Bullets:** JWT auth · Multer uploads · GeoJSON reports · Nominatim geocoding  

**Say:**  
> *Two React frontends share one REST API and one MongoDB database. This separation keeps citizen and admin experiences distinct and secure.*

---

### Slide 6 — Technology stack

**Title:** Tech Stack  

| Layer | Technology |
|-------|------------|
| Frontend | React 19, React Router, Leaflet, i18next |
| Backend | Node.js 20, Express 5, Mongoose |
| Database | MongoDB (Atlas) |
| Auth | JWT, bcrypt, optional Google OAuth |
| Maps | Leaflet + OpenStreetMap |
| Hosting | Netlify + Render |

---

### Slide 7 — Database design

**Title:** Data Model (simplified)  

**Show entities:**

- User, Admin, Report, Comment, Notification  
- Governorate → District (Lebanon seed)  
- Report: category, status, priority, images[], GeoJSON location, duplicateReview  

**Visual:** ER-style box diagram (5–6 boxes with arrows)

**Say:**  
> *Reports store location as GeoJSON Point with a 2dsphere index for distance-based duplicate detection.*

---

### Slide 8 — Citizen features

**Title:** Citizen Application  

**Bullets:**

- Register / login (+ Google)  
- **Create report:** category, description, 1–5 photos, map pin  
- **Use GPS** → auto governorate/district  
- **Nearby similar** warning before submit  
- My reports, notifications, profile  
- Public **home feed**, **map**, **Discover** (district spotlight)  
- **English / Arabic** + RTL  

**Visual:** 2–3 screenshots in a row

---

### Slide 9 — Admin features

**Title:** Admin Application  

**Bullets:**

- District-scoped report inbox + filters  
- Update status, priority, department, status note  
- **Duplicate review** (suggest → confirm / dismiss)  
- **Analytics** dashboard  
- **District spotlight** editor  
- PDF export  

**Visual:** Admin reports list + analytics screenshot

---

### Slide 10 — Geolocation (differentiator)

**Title:** GPS & Location Pipeline  

**Flow diagram:**

```
User taps "Use GPS"
    → Browser Geolocation API
    → Leaflet pin (lat, lng)
    → GET /api/location/from-coordinates
    → Nominatim + DB match (+ fallback)
    → Governorate + District auto-filled
```

**Say:**  
> *We never access GPS hardware directly — the browser asks the OS. The backend reverse-geocodes and matches to our Lebanese district directory.*

---

### Slide 11 — Duplicate detection

**Title:** Duplicate Detection  

**Bullets:**

- Same **district** + **category**  
- Within **±72 hours**  
- Within **500 meters** (Haversine)  
- Citizen: warning at create time  
- Admin: review panel — human confirms  

**Say:**  
> *The system suggests duplicates but never auto-merges — the admin keeps control.*

---

### Slide 12 — Arabic / i18n

**Title:** Bilingual Support  

**Bullets:**

- i18next — `en.json` + `ar.json`  
- RTL layout when Arabic selected  
- Categories, statuses, forms, notifications translated  
- API stays English; UI handles presentation  

**Visual:** Same screen side-by-side EN | AR

---

### Slide 13 — Security

**Title:** Security Measures  

**Bullets:**

- JWT authentication  
- bcrypt password hashing + policy  
- Role-based access (district scope)  
- Rate limiting on auth and report creation  
- Upload validation (images only, size limit)  
- CORS restricted to frontend origins  
- HTTPS in production  

**Optional:** Small “Limitations” footnote (localStorage JWT, ephemeral uploads)

---

### Slide 14 — Deployment

**Title:** Deployment  

| Component | URL / Host |
|-----------|------------|
| Citizen | `citycarelb.netlify.app` |
| Admin | `citycareadminlb.netlify.app` |
| API | Render (`city-care-7ygl.onrender.com`) |
| DB | MongoDB Atlas |

**Say:**  
> *The system is live and testable on mobile — important for GPS demos.*

---

### Slide 15 — Evaluation

**Title:** Testing & Evaluation  

**Adapt to your actual work:**

- Functional tests: citizen submit → admin resolve  
- Scenario testing: GPS, Arabic switch, wrong-district admin (403)  
- Optional: SUS score / task completion times with N users  
- Production smoke tests on Netlify + Render  

**Chart idea:** Bar chart of task success or SUS score if you have data

---

### Slide 16 — Results / screenshots

**Title:** System in Action  

**Content:** 4–6 thumbnail screenshots:

1. Create report with map  
2. Nearby similar warning  
3. Admin status change  
4. Analytics page  
5. Arabic UI  
6. Discover / spotlight  

No live talking — quick visual recap before demo or after demo as backup.

---

### Slide 17 — Limitations & future work

**Title:** Limitations & Future Work  

**Limitations:**

- Web-only; no native app  
- Render free tier cold starts + ephemeral image storage  
- Geocoding depends on external OSM  

**Future:**

- Cloud storage (S3), push notifications, SMS  
- Municipal GIS integration, auto-routing by category  

---

### Slide 18 — Conclusion

**Title:** Conclusion  

**Bullets:**

- Built end-to-end civic reporting for Lebanon  
- Citizens: easy submit with GPS and Arabic  
- Admins: district-scoped triage, duplicates, analytics  
- Deployed and demonstrable on production URLs  

**Closing line:**  
> *Thank you. I am ready for your questions.*

---

## 3. Presentation flow (minute-by-minute)

| Min | Action |
|-----|--------|
| 0:00 | Slide 1 — Introduce yourself and project |
| 0:30 | Slides 2–3 — Problem and objectives |
| 2:00 | Slides 4–6 — Roles, architecture, stack |
| 4:30 | Slide 7 — Database (brief) |
| 5:00 | Slides 8–9 — Feature overview |
| 6:00 | **→ Switch to live demo** (see §4) |
| 12:00 | Return to slides 10–12 — GPS, duplicates, Arabic (recap what demo showed) |
| 14:00 | Slides 13–15 — Security, deployment, evaluation |
| 16:00 | Slides 17–18 — Limits, conclusion |
| 17:00 | Q&A |

**Tip:** If time is short (10 min total), merge slides 10–12 into demo narration and skip slide 16.

---

## 4. Live demo script (5–7 minutes)

### Before defense — checklist

- [ ] Chrome/Edge tabs pre-opened (see below)  
- [ ] Logged out of both apps (start fresh) or use prepared accounts  
- [ ] Phone ready if showing mobile GPS (optional)  
- [ ] Render API awake — hit `/api/health` 1 minute before  
- [ ] Test image file on desktop for upload  
- [ ] Internet connection verified  

### Tab setup

| Tab | URL |
|-----|-----|
| 1 | Citizen home — `https://citycarelb.netlify.app` |
| 2 | Citizen create report (after login) |
| 3 | Admin login — `https://citycareadminlb.netlify.app` |
| 4 | Admin reports list (after login) |
| 5 | Backup: screenshot PDF in slide deck |

---

### Demo Part A — Citizen (3–4 min)

**Script:**

1. **Home page (public)**  
   > *Citizens can browse open reports without logging in — this supports transparency.*  
   - Scroll feed; optionally open map link.

2. **Language switch**  
   > *The platform is bilingual. Switching to Arabic flips the layout to RTL.*  
   - Toggle EN → AR on home; show nav + one label change.  
   - Switch back to EN for demo clarity (or continue in Arabic if committee prefers).

3. **Register or login**  
   > *I log in as a citizen.*  
   - Use your prepared account.

4. **Create report**  
   > *The core flow: category, description, location, photos.*  
   - Select category: e.g. **Infrastructure & Roads**  
   - Short description: *"Large pothole near main road, risk to vehicles."*  
   - Click **Use GPS** (or drag pin if GPS denied in room):  
     > *GPS reads coordinates from the browser, moves the map pin, and the API resolves governorate and district.*  
   - Show governorate/district auto-filled.  
   - If **nearby similar** appears:  
     > *The system warns if a similar open report exists within 500 meters — duplicate prevention.*  
   - Upload 1 photo.  
   - Submit.  
   > *Report is stored with GeoJSON coordinates and enters PENDING status.*

5. **My reports → detail**  
   > *The citizen tracks status here and receives notifications when admin updates.*

---

### Demo Part B — Admin (2–3 min)

**Script:**

1. **Admin login**  
   > *District admins only see their district. I log in as the Beirut district admin.*  
   - Open admin tab; login.

2. **Reports list**  
   > *Filters by status, priority, category. Map view shows geographic distribution.*  
   - Find the report you just created (or a seeded one).  
   - Optionally show filter by status = Submitted.

3. **Report detail — triage**  
   > *Admin reviews photos, map, citizen info.*  
   - Change status: **Submitted → In Progress**  
   - Set priority: **High**  
   - Add status note: *"Maintenance team assigned."*  
   - Save.  
   > *Citizen gets an in-app notification.*

4. **Duplicate panel (if visible)**  
   > *If similar reports exist, the system suggests duplicates; admin confirms or dismisses.*

5. **Analytics (30 s)**  
   > *Dashboard shows totals, status breakdown, and submission trends.*  
   - Open Analytics page briefly.

6. **Return to citizen (optional 20 s)**  
   - Refresh report detail or notifications to show status changed.

---

### Demo Part C — Optional extras (if time)

| Feature | Where | One line |
|---------|-------|----------|
| Discover | `/discover` | District civic content and events |
| Public explore | Home → open report | Likes and comments |
| PDF export | Admin reports list | Export filtered reports |
| Google login | Login page | OAuth for faster signup |

---

## 5. What to show vs. what to tell

| Show live | Mention only (slide / oral) |
|-----------|----------------------------|
| Create report + GPS | JWT implementation details |
| Admin status change | bcrypt cost factor |
| Arabic toggle | Mongoose schema code |
| Analytics page | Rate limit numbers |
| Nearby similar warning | Nominatim fallback algorithm |
| Notifications update | Seed script commands |

**Rule:** Demo **user-visible value**; slides carry **implementation depth**.

---

## 6. Example phrases (smooth transitions)

| Moment | Example phrase |
|--------|----------------|
| Problem → solution | *"To address this gap, I designed a three-tier web application…"* |
| Before architecture | *"At a high level, two React clients communicate with one REST API…"* |
| Before demo | *"I will now walk through the primary use case in the deployed environment."* |
| GPS click | *"Watch the governorate and district fields populate automatically from coordinates."* |
| After submit | *"The report is persisted with geospatial indexing for later proximity queries."* |
| Admin login | *"Access control ensures this admin only sees Beirut district reports."* |
| Status change | *"This triggers a notification pipeline to the citizen."* |
| Before Q&A | *"In summary, the project delivers a complete civic reporting loop. I welcome your questions."* |

---

## 7. Backup plan if live demo fails

| Failure | Response |
|---------|------------|
| Render cold start (slow) | While waiting: show architecture slide + explain flow; pre-warm API before defense |
| GPS denied in room | Drag pin on map; explain Geolocation API verbally |
| Upload fails | Use existing report in admin; show triage only |
| Netlify down | Use local `localhost:3001` / `3000` with local API |
| Projector issue | Walk through screenshot slide 16 narratively |

Keep a **short screen recording** (2–3 min) on USB or laptop as last resort.

---

## 8. Anticipating questions during the demo

Committee may interrupt. Short replies:

| Interrupt | Reply |
|-----------|-------|
| "Why two apps?" | *"Different roles and security boundaries; smaller citizen bundle."* |
| "Where are images stored?" | *"On the API server under /uploads; production would use cloud storage."* |
| "Can any citizen see all reports?" | *"Public feed shows open reports only; private detail is owner-only."* |
| "How do you know the district?" | *"Reverse geocoding from coordinates matched to our 26-district seed."* |
| "Is this secure enough for government?" | *"It's a thesis prototype with JWT and RBAC; production would add audit logs, 2FA, and cloud storage."* |

Full answers: [PROJECT-DEFENSE-QA.md](./PROJECT-DEFENSE-QA.md)

---

## 9. Suggested appendix (not presented, for handout)

- API endpoint table (from [API.md](./API.md))  
- Sample report JSON shape  
- SUS questionnaire results (if any)  
- GitHub repo link  
- Seed admin list excerpt  

---

## 10. One-page rehearsal checklist

**Night before:**

- [ ] Slides exported to PDF backup  
- [ ] Demo accounts tested on production  
- [ ] Phone charged (mobile GPS optional)  
- [ ] Read Q&A doc sections 2, 6, 7, 13  

**30 min before:**

- [ ] Open tabs; warm API  
- [ ] Log out both apps  
- [ ] Test projector resolution (1920×1080)  
- [ ] Deep breath — you built a deployed full-stack system  

---

## Related documents

| Document | Purpose |
|----------|---------|
| [PROJECT-DEFENSE-QA.md](./PROJECT-DEFENSE-QA.md) | Questions & technical answers |
| [FEATURES-REPORT.md](./FEATURES-REPORT.md) | Complete feature reference |
| [thesis-deliverables.md](./thesis-deliverables.md) | Written thesis checklist |

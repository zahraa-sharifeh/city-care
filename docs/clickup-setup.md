# ClickUp setup (Smart City thesis)

Use this as a template inside ClickUp; duplicate tasks and assign **Owner** to you or **Manar**.

## Space and lists

| List | Purpose |
|------|---------|
| **Milestones** | Dated goals: proposal freeze, MVP demo, feature complete, writing freeze, defense rehearsal |
| **Backend API** | Node/Mongo tasks: models, routes, auth, uploads, seeds |
| **citizen-web** | React citizen app: auth, report form, my reports, comments |
| **admin-web** | React admin app: login, report list/filters, status updates |
| **Thesis deliverables** | Chapters, diagrams, evaluation, ethics/privacy, screenshots |

## Custom fields (recommended)

- **Owner** (dropdown): You | Manar
- **Area** (labels): API | UI | Thesis
- **Phase** (dropdown): A Foundation | B MVP | C Polish | D Demo/Docs
- **Risk** (dropdown): Low | Medium | High
- **Definition of done** (short text)

## Dependencies (examples)

1. `GET/PATCH admin reports API` → blocks → `Admin reports table + detail UI`
2. `Fix User schema + public locations` → blocks → `Citizen registration + report form`
3. `API contract agreed` → blocks → parallel UI work

## Starter tasks (paste into ClickUp)

**Backend**

- Align `User` schema with registration (`districtId`) and verify JWT payloads
- Public `GET /api/governorates` and `GET /api/districts` (done in repo; verify)
- Citizen report endpoints: `POST/GET /api/reports…` per [API.md](./API.md)
- Admin report endpoints: `GET/PATCH /api/admin/reports…` with district scoping
- Optional: Joi validation + consistent error JSON

**citizen-web**

- Env `REACT_APP_API_URL`, local run on port **3001**
- Login, register, new report (multipart), my reports, report detail + comments

**admin-web**

- Env `REACT_APP_API_URL`, local run on port **3000**
- Admin login, reports list with filters/pagination, report detail + status save

**Thesis**

- Architecture + data model diagrams (match actual code)
- Threats/limitations (JWT, uploads, role scope)
- Evaluation plan + results (SUS, task time, or heuristic review)
- Demo script + grader runbook (see root README)

## Cadence

- Weekly: review **Milestones**, clear blockers, attach screenshots to closed UI tasks
- Keep **API.md** in sync when endpoints change

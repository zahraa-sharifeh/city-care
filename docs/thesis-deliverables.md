# Thesis deliverables checklist

Use alongside development. Replace bracketed items with your university’s exact chapter names.

## Core written content

- [ ] **Problem & motivation**: citizen reporting, transparency, municipal operations
- [ ] **Requirements & use cases**: citizen submit/track; admin triage/update status; roles (`SUPER_ADMIN`, `DISTRICT_ADMIN`)
- [ ] **System architecture**: React clients → REST API → MongoDB; static uploads (see [API.md](./API.md))
- [ ] **Database design**: collections/schemas for `User`, `Admin`, `Report`, `Comment`, `Governorate`, `District`
- [ ] **Security**: JWT, password hashing, role-based access, HTTPS in deployment, known limits (e.g. local file uploads)
- [ ] **Threats / limitations**: token theft, IDOR (mitigated by checks), abuse of image upload, scalability of file storage

## Evaluation (pick what fits your timeline)

- [ ] **Method**: e.g. System Usability Scale (SUS) + one task scenario (“submit a report”, “change status to resolved”)
- [ ] **Participants**: N and profile (students, pilot users, etc.)
- [ ] **Results**: scores, times, qualitative notes
- [ ] **Discussion**: what would change with more time (maps, notifications, analytics)

## Demonstration

- [ ] **Demo script**: seed data, login as citizen + admin, show full path in under ~10 minutes
- [ ] **Screenshots / appendix**: key UI states for thesis PDF
- [ ] **Reproducibility**: pointer to root [README.md](../README.md) for local run

## Ethics & data

- [ ] **Personal data**: email, names, photos — purpose limitation, test vs production, consent for user tests
- [ ] **Retention**: how long demo data is kept

## Optional polish

- [ ] **Deployment**: MongoDB Atlas + API host + static hosting for `citizen-web` / `admin-web` builds
- [ ] **Future work**: mobile again, push notifications, OpenStreetMap integration, department routing

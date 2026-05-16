# Test data — Create report (citizen app)

Sample values you can copy when testing **New report** (`/reports/new` in `citizen-web`).  
Use a **citizen account** (register or log in first).

---

## Before you start

| Requirement | Notes |
|-------------|--------|
| **Backend + MongoDB** | API running (e.g. `http://localhost:5000`). |
| **Locations seeded** | Run `npm run seed:locations` in `backend/` so governorates/districts exist. |
| **At least 1 photo** | JPG or PNG; any small test image is fine. |
| **Governorate + district** | Pick from dropdowns **or** move the map pin / use GPS so the app auto-fills them. |

### Required fields (summary)

| Field | Rule |
|-------|------|
| Category | One of the 12 categories below (exact label). |
| Description | Non-empty text. |
| Governorate | From API list. |
| District | Must belong to selected governorate. |
| Location description | Street, landmark, building, etc. |
| Map pin (lat / lng) | Set by map click, drag pin, GPS, or district change — not typed manually. |
| Images | **1–5** files. |

Default map center if you do nothing: **Beirut** (`33.893800`, `35.501800`).

---

## Valid categories (copy exactly)

1. Infrastructure & Roads  
2. Lighting & Electricity  
3. Water & Sewage  
4. Waste & Cleanliness  
5. Parks & Public Spaces  
6. Traffic & Transport  
7. Buildings & Construction  
8. Noise & Disturbances  
9. Environment & Pollution  
10. Animals & Pests  
11. Public Safety Hazards  
12. Other  

---

## Governorates & districts (after seed)

Pick **Governorate** first, then **District**:

| Governorate | Districts |
|-------------|-----------|
| Beirut | Beirut |
| North | Tripoli, Zgharta, Batroun, Bcharre, Koura, Minieh - Danniyeh |
| Mount Lebanon | Baabda, Matn, Kesrouane, Byblos, El Chouf, Aalay |
| Akkar | Akkar |
| South | Saida, Sour, Jezzine |
| Nabatiyeh | Bint Jbeil, Marjayoun, Hasbaiyya, Nabatiyeh |
| Beqaa | Western Bekaa, Zahle, Rachaiya |
| Baalbek-Hermel | Baalbek, Hermel |

---

## Ready-to-use test reports

For each scenario: select category and area, paste **Description** and **Location description**, move the pin to the **Latitude / Longitude** (or click the map near that point), attach **1+ photos**, submit.

### 1 — Pothole (Beirut)

| Field | Value |
|-------|--------|
| **Category** | Infrastructure & Roads |
| **Description** | Large pothole in the right lane, about 40 cm wide. Cars swerve to avoid it. Visible after rain. |
| **Governorate** | Beirut |
| **District** | Beirut |
| **Location description** | Hamra Street, near Costa Coffee, facing the sea |
| **Latitude** | `33.896200` |
| **Longitude** | `35.478400` |

---

### 2 — Streetlight out (Mount Lebanon)

| Field | Value |
|-------|--------|
| **Category** | Lighting & Electricity |
| **Description** | Street lamp has been off for two weeks. The sidewalk is very dark at night. |
| **Governorate** | Mount Lebanon |
| **District** | Matn |
| **Location description** | Dora highway service road, next to bus stop |
| **Latitude** | `33.908500` |
| **Longitude** | `35.552100` |

---

### 3 — Water leak (South)

| Field | Value |
|-------|--------|
| **Category** | Water & Sewage |
| **Description** | Water flowing from a broken pipe cover on the pavement. Pool forming on the road. |
| **Governorate** | South |
| **District** | Saida |
| **Location description** | Riad El Solh street, 50 m from the old souk entrance |
| **Latitude** | `33.563100` |
| **Longitude** | `35.368900` |

---

### 4 — Illegal dumping (Beqaa)

| Field | Value |
|-------|--------|
| **Category** | Waste & Cleanliness |
| **Description** | Pile of household waste bags dumped beside the road. Strong smell; attracting animals. |
| **Governorate** | Beqaa |
| **District** | Zahle |
| **Location description** | Industrial zone side road, opposite empty lot |
| **Latitude** | `33.845300` |
| **Longitude** | `35.901900` |

---

### 5 — Broken playground equipment (North)

| Field | Value |
|-------|--------|
| **Category** | Parks & Public Spaces |
| **Description** | Swing chain broken; sharp metal exposed. Children still use the park. |
| **Governorate** | North |
| **District** | Tripoli |
| **Location description** | Public garden near Tal neighborhood, main gate |
| **Latitude** | `34.436700` |
| **Longitude** | `35.849700` |

---

### 6 — Traffic signal not working (Beirut)

| Field | Value |
|-------|--------|
| **Category** | Traffic & Transport |
| **Description** | Traffic lights stuck on red in all directions during evening rush hour. |
| **Governorate** | Beirut |
| **District** | Beirut |
| **Location description** | Charles Helou area, junction by the port road |
| **Latitude** | `33.901500` |
| **Longitude** | `35.518200` |

---

### 7 — Construction debris on sidewalk (Mount Lebanon)

| Field | Value |
|-------|--------|
| **Category** | Buildings & Construction |
| **Description** | Rubble and sand bags blocking half the sidewalk. Pedestrians walk on the road. |
| **Governorate** | Mount Lebanon |
| **District** | Baabda |
| **Location description** | Hazmieh main road, near pharmacy |
| **Latitude** | `33.860000` |
| **Longitude** | `35.540000` |

---

### 8 — Loud generator at night (Other)

| Field | Value |
|-------|--------|
| **Category** | Noise & Disturbances |
| **Description** | Generator running past midnight every day for the past week. Very loud in nearby apartments. |
| **Governorate** | Mount Lebanon |
| **District** | El Chouf |
| **Location description** | Residential building, 3rd floor rear, Damour sea road |
| **Latitude** | `33.730000` |
| **Longitude** | `35.450000` |

---

### 9 — Burning smell / smoke (Environment)

| Field | Value |
|-------|--------|
| **Category** | Environment & Pollution |
| **Description** | Thick smoke and plastic burning smell from vacant lot. Started this morning. |
| **Governorate** | Nabatiyeh |
| **District** | Nabatiyeh |
| **Location description** | Open field behind municipal building |
| **Latitude** | `33.378000` |
| **Longitude** | `35.483000` |

---

### 10 — Stray dogs pack (Animals)

| Field | Value |
|-------|--------|
| **Category** | Animals & Pests |
| **Description** | Group of stray dogs near school entrance in the morning. Parents concerned for students. |
| **Governorate** | Akkar |
| **District** | Akkar |
| **Location description** | School street, Halba town center |
| **Latitude** | `34.543000` |
| **Longitude** | `36.079000` |

---

### 11 — Exposed electrical wires (Safety)

| Field | Value |
|-------|--------|
| **Category** | Public Safety Hazards |
| **Description** | Low-hanging damaged cable near a metal pole. Sparking seen during rain. |
| **Governorate** | Baalbek-Hermel |
| **District** | Baalbek |
| **Location description** | Main market street, near fruit stands |
| **Latitude** | `34.005900` |
| **Longitude** | `36.204000` |

---

### 12 — Miscellaneous (Other)

| Field | Value |
|-------|--------|
| **Category** | Other |
| **Description** | Damaged public bench and missing bus schedule sign at stop. |
| **Governorate** | South |
| **District** | Sour |
| **Location description** | Corniche near fishing harbor |
| **Latitude** | `33.273000` |
| **Longitude** | `35.203000` |

---

## Quick copy — minimal smoke test

Fastest path to a successful submit:

```
Category:          Other
Description:       Test report for QA — please ignore.
Governorate:       Beirut
District:          Beirut
Location description: Downtown Beirut, test pin near Martyrs Square
Latitude:          33.893800
Longitude:         35.501800
Photos:            1 any .jpg or .png
```

---

## Testing tips

### Map / GPS

- **Click map** or **drag pin** → coordinates update; app tries to set governorate/district (Lebanon only).
- **Use my current location (GPS)** → browser asks permission; works best on a phone outdoors.
- **Change district** → map may jump to that district (forward geocode).

### Nearby similar reports

After category + district + pin are set, the form shows **Nearby similar open reports** within **500 m**. Use two reports with the same category and close coordinates to test duplicates.

### Duplicate test pair (same area)

| Report A | Report B |
|----------|----------|
| Category: Infrastructure & Roads | Same |
| District: Beirut | Same |
| Lat/Lng: `33.896200`, `35.478400` | `33.896250`, `35.478450` (a few metres away) |
| Description: “Pothole test A” | “Pothole test B” |

### What usually fails validation

| Mistake | Result |
|---------|--------|
| No image | “Please attach at least one image.” |
| District not in governorate | Server error / invalid district |
| Pin outside Lebanon + auto district fails | Choose governorate/district manually |
| Empty description or location text | Browser / server validation error |

---

## Optional: API test (Postman / curl)

If you test without the UI, `POST /api/reports` needs **multipart/form-data**:

- `category`, `description`, `governorateId`, `districtId`, `locationDescription`, `lat`, `lng`
- `images` — one or more files  
- Header: `Authorization: Bearer <citizen_jwt>`

Get `governorateId` / `districtId` from `GET /api/governorates` and `GET /api/districts?governorateId=...`.

---

## Related docs

- [GEOLOCATION.md](./GEOLOCATION.md) — how GPS and map coordinates work  
- [API.md](./API.md) — report endpoints  
- [FEATURES-REPORT.md](./FEATURES-REPORT.md) — full feature list  

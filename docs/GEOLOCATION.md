# Location & GPS in Smart City Issue Reporting

This document explains how user location works in this project: what **GPS** means, what the **Browser Geolocation API** is, how the citizen app obtains coordinates, and how the backend stores and uses them.

For API endpoints related to location, see [API.md](./API.md). For overall features, see [FEATURES-REPORT.md](./FEATURES-REPORT.md).

---

## 1. What is GPS?

**GPS (Global Positioning System)** is a satellite-based navigation system. A device with a GNSS/GPS receiver listens to satellite signals and estimates its position on Earth as **latitude** and **longitude**.

- Works best **outdoors** with a clear view of the sky.
- Typical accuracy is on the order of **a few metres to tens of metres** with a good receiver.
- Phones usually have a dedicated chip; **many laptops do not**.

In everyday language, people say “GPS” for any kind of device location. In software, **true GPS** is only one possible source. Browsers and operating systems may also use **Wi‑Fi**, **cell towers**, or **IP address** to estimate position.

---

## 2. What is the Browser Geolocation API?

The **Geolocation API** is a **built-in browser feature** (not an npm package). JavaScript accesses it through:

```js
navigator.geolocation
```

### Main methods

| Method | Purpose |
|--------|---------|
| `getCurrentPosition(success, error, options)` | One-time position (used in this project). |
| `watchPosition(success, error, options)` | Repeated updates while the user moves (not used here). |

### Typical result

On success, the callback receives a `position` object:

| Field | Meaning |
|-------|---------|
| `position.coords.latitude` | Degrees north/south (−90 to 90). |
| `position.coords.longitude` | Degrees east/west (−180 to 180). |
| `position.coords.accuracy` | Estimated error radius in **metres** (optional to use). |

### Requirements and behaviour

1. **User permission** — The browser shows “Allow location?” If denied, the app cannot read coordinates.
2. **Secure context** — Production sites should use **HTTPS** (or `http://localhost` in development).
3. **The browser does not locate by itself** — It asks the **operating system**. The OS may combine GPS, Wi‑Fi, cell, Bluetooth, or IP. **Application code cannot choose** which source is used.
4. **`enableHighAccuracy: true`** — Hints that the OS should prefer the best available fix (often satellite GPS on phones). It does **not** guarantee satellite GPS.
5. **`maximumAge: 0`** — Do not reuse an old cached position; request a fresh reading.
6. **`timeout`** — Fail if no position is returned within the given milliseconds.

---

## 3. Wi‑Fi, IP, or satellite — who decides?

```text
  User clicks "Use GPS"
           │
           ▼
  navigator.geolocation.getCurrentPosition(...)
           │
           ▼
  Browser (permission, timeout, options)
           │
           ▼
  Operating system (Windows, macOS, Android, iOS, …)
           │
           ├── Satellite GPS / GNSS (common on phones outdoors)
           ├── Wi‑Fi positioning (common on laptops indoors)
           ├── Cell tower triangulation (phones)
           └── IP-based geolocation (rough; common on desktops)
           │
           ▼
  latitude, longitude (+ accuracy) returned to JavaScript
```

| Environment | Typical source | Notes |
|-------------|----------------|--------|
| Smartphone outdoors | Often **GNSS/GPS** | Best accuracy. |
| Smartphone indoors | Often **Wi‑Fi** + cell | GPS may be weak. |
| Laptop without GPS chip | Often **Wi‑Fi** | May be tens of metres off. |
| Desktop on Ethernet | Often **IP** | Can be city-level or wrong (VPN affects this). |

**This project never talks to a GPS chip or Wi‑Fi API directly.** It only calls the Geolocation API and uses the coordinates returned.

---

## 4. What happens in this app (citizen — Create report)

**File:** `citizen-web/src/pages/CreateReport.js`  
**Function:** `useGpsLocation()` (bound to the **Use GPS** button).

### Step-by-step

1. **Preconditions**
   - Map and marker must be initialised.
   - `navigator.geolocation` must exist; otherwise the user sees an error that the browser does not support location.

2. **Request position**

   ```js
   navigator.geolocation.getCurrentPosition(success, error, {
     enableHighAccuracy: true,
     timeout: 25000,
     maximumAge: 0,
   });
   ```

   | Option | Value in this app | Effect |
   |--------|-------------------|--------|
   | `enableHighAccuracy` | `true` | Ask OS for the best available fix. |
   | `timeout` | `25000` (25 s) | Fail if no fix in time → timeout message. |
   | `maximumAge` | `0` | No stale cached position. |

3. **No extra criteria in app code**
   - There is **no** minimum accuracy threshold (e.g. reject if accuracy &gt; 100 m).
   - There is **no** client-side “must be inside Lebanon” check on the raw GPS read.
   - Coordinates are stored in React state with **6 decimal places**.

4. **On success**
   - Move the Leaflet map pin to `(latitude, longitude)`.
   - Zoom map to level **17**.
   - Call backend **`GET /api/location/from-coordinates?lat=…&lng=…`** to auto-fill governorate, district, and often `locationDescription`.

5. **On error** (browser error codes)

   | Code | User-facing meaning |
   |------|---------------------|
   | 1 | Permission denied. |
   | 2 | Position unavailable. |
   | 3 | Timeout (25 s). |

### Other ways to set location (same page)

| Action | Behaviour |
|--------|-----------|
| **Drag pin / click map** | Updates `lat`/`lng`; after **450 ms** debounce, same reverse lookup as GPS. |
| **Change district dropdown** | Forward geocode `"District, Governorate, Lebanon"` via `GET /api/location/search` and moves the pin (unless a recent pin lookup just set district — 1.2 s suppress). |
| **Default on load** | Pin starts near Beirut (`33.8938`, `35.5018`) until the user moves it or uses GPS. |

### Submit

On submit, the form sends `lat` and `lng` with the report. Validation only checks that values are **valid numbers** in range (`|lat| ≤ 90`, `|lng| ≤ 180`). It does not re-run GPS or enforce Lebanon on the client.

---

## 5. Backend: reverse lookup from coordinates

**Endpoint:** `GET /api/location/from-coordinates?lat=&lng=`  
**Controller:** `backend/src/controllers/locationController.js`  
**Service:** `backend/src/services/reverseAdminLookup.js`

After the browser provides lat/lng, the server:

1. Validates numeric lat/lng.
2. Checks a **Lebanon bounding box** (approximate WGS84):
   - Latitude `33.02` – `34.75`
   - Longitude `34.92` – `36.65`  
   Outside → `400` with message to pick governorate/district manually.
3. Calls **OpenStreetMap Nominatim** reverse geocoding for a human-readable address.
4. Matches address tokens to seeded **governorate** and **district** names (including aliases, e.g. Tyre → Sour).
5. Returns `governorateId`, `districtId`, names, and `displayName`.

District assignment is **name-based matching**, not polygon geofencing.

**Related:** `GET /api/location/search?q=…` — forward search (Nominatim proxy) for place/district search.

---

## 6. How coordinates are stored in the database

**Model:** `backend/src/models/Report.js`

Reports use a MongoDB **GeoJSON Point**:

```js
location: {
  type: "Point",
  coordinates: [lng, lat]   // longitude FIRST, then latitude
}
```

**Important:** GeoJSON order is **`[longitude, latitude]`**, not lat-first.

**Create report** (`backend/src/controllers/reportController.js`):

```js
location: { type: "Point", coordinates: [Number(lng), Number(lat)] }
```

Maps (Leaflet), Google Maps links, and WhatsApp share text use **`lat = coordinates[1]`**, **`lng = coordinates[0]`**.

---

## 7. Other uses of coordinates in the project

| Feature | How location is used |
|---------|----------------------|
| **Nearby similar** (create report) | `GET /api/reports/nearby-similar` — MongoDB `$near` + Haversine distance (default **500 m** radius). |
| **Duplicate detection** (admin) | Same category, same district, ±**72 hours**, ≤**500 m** (Haversine). |
| **Maps** (citizen/admin) | Leaflet reads `[lng, lat]` from DB and displays `[lat, lng]`. |
| **Map page** | Normalises coordinates; may swap if lat/lng appear reversed. |
| **PDF / WhatsApp share** | Google Maps link `https://www.google.com/maps?q=lat,lng`. |

**Distance math:** Haversine formula — straight-line (“as the crow flies”) distance in metres, not driving distance.

---

## 8. Practical guidance for users and testers

| Situation | Recommendation |
|-----------|----------------|
| Testing on a **laptop** | Location may come from **Wi‑Fi** or **IP**; pin can be inaccurate. Prefer dragging the pin or testing on a **phone**. |
| **Indoors** | Expect weaker or network-based fixes. |
| **VPN** | IP-based location may show the wrong country/city. |
| **Permission denied** | User must allow location in browser/site settings. |
| **Outside Lebanon** | Reverse lookup fails; user must select governorate and district manually. |
| **Best accuracy** | Phone, outdoors, clear sky, permission allowed; optionally verify pin on the map before submit. |

---

## 9. Code reference (quick index)

| Topic | Location |
|-------|----------|
| Use GPS button & Geolocation options | `citizen-web/src/pages/CreateReport.js` → `useGpsLocation()` |
| Reverse lookup from pin | `GET /api/location/from-coordinates` |
| Place search | `GET /api/location/search` |
| Report storage | `backend/src/models/Report.js` |
| Create report API | `backend/src/controllers/reportController.js` → `createReport` |
| Nearby similar | `reportController.js` → `getNearbySimilar` |
| Duplicate distance | `backend/src/services/duplicateDetection.js` |
| Admin/citizen maps | `admin-web/src/components/ReportMap.js`, `citizen-web/src/pages/MapPage.js` |

---

## 10. Summary

- **GPS** = satellite positioning; many laptops lack a GPS chip.
- **Browser Geolocation API** = standard way for websites to request `latitude`/`longitude` with user permission. 
- **This app** calls `getCurrentPosition` with high accuracy, 25 s timeout, and no cache; it does **not** choose Wi‑Fi vs IP vs GPS — the **OS** does.
- **After** coordinates are known, the **backend** reverse-geocodes and matches **Lebanon** governorates/districts; the DB stores **`[lng, lat]`** as GeoJSON.

For future improvements (not implemented today): reject low `accuracy`, warn when outside Lebanon before submit, or show accuracy to the user in the UI.








//////////////////////////////////////////////




Here's a complete example flow for a laptop user visiting a website:

### 1. User opens a website

The user visits:

```text
https://citycarelb.netlify.app
```

### 2. Website requests location

JavaScript runs:

```javascript
navigator.geolocation.getCurrentPosition(
  success,
  error
);
```

### 3. Browser asks for permission

Chrome displays:

```text
citycarelb.netlify.app wants to know your location

[Allow] [Block]
```

### 4. User clicks "Allow"

The browser starts determining the location.

### 5. Browser gathers signals

Suppose the laptop detects:

```text
Wi-Fi: Home_Wifi_5G
Wi-Fi: Cafe_Internet
Wi-Fi: Neighbor_Wifi
Public IP: 185.xxx.xxx.xxx
```

### 6. Location service estimates position

The browser sends the Wi-Fi identifiers and network information to its location provider.

The provider responds:

```json
{
  "lat": 33.5606,
  "lng": 35.3756,
  "accuracy": 25
}
```

### 7. Browser returns data to JavaScript

The success callback receives:

```javascript
{
  coords: {
    latitude: 33.5606,
    longitude: 35.3756,
    accuracy: 25
  }
}
```

### 8. Website uses the coordinates

For example, your CityCare app could automatically center a map:

```javascript
function success(position) {
  const lat = position.coords.latitude;
  const lng = position.coords.longitude;

  map.setView([lat, lng], 15);
}
```

### 9. Website sends location to backend (optional)

The frontend may send the coordinates when creating a report:

```json
{
  "title": "Pothole",
  "description": "Large pothole near school",
  "latitude": 33.5606,
  "longitude": 35.3756
}
```

### 10. Backend stores it

Example MongoDB document:

```json
{
  "_id": "123",
  "title": "Pothole",
  "latitude": 33.5606,
  "longitude": 35.3756,
  "status": "Open"
}
```

### Real-world flow diagram

```text
User
 │
 │ Opens website
 ▼
Website
 │
 │ navigator.geolocation.getCurrentPosition()
 ▼
Browser
 │
 │ "Allow location?"
 ▼
User clicks Allow
 │
 ▼
Browser
 │
 ├─ Reads nearby Wi-Fi networks
 ├─ Reads IP address
 └─ Uses GPS if available
 │
 ▼
Location Service
 │
 ▼
Latitude + Longitude
 │
 ▼
Browser
 │
 ▼
Website JavaScript
 │
 ▼
Backend API
 │
 ▼
Database
```

For your CityCare project, the usual flow is:

**Citizen opens "Create Report" → clicks "Use My Location" → browser asks permission → coordinates are retrieved → map pin is placed automatically → coordinates are saved with the report.**



//////////////////////////////////////////////



When the browser needs your location, it doesn't directly "know" where you are. It asks the **operating system (Windows, macOS, Linux)** for location information, and the OS gathers available signals.

### 1. Reading nearby Wi-Fi networks

Your laptop's Wi-Fi adapter constantly scans for nearby access points.

For example, Windows might detect:

```text
Home_Wifi      BSSID: AA:BB:CC:11:22:33
Cafe_Wifi      BSSID: DD:EE:FF:44:55:66
Office_Wifi    BSSID: 77:88:99:AA:BB:CC
```

The browser/OS can see:

* Wi-Fi network names (SSIDs)
* Router hardware addresses (BSSIDs/MAC addresses)
* Signal strengths

A location service compares these router identifiers with a large database of known Wi-Fi locations.

Example:

```text
AA:BB:CC:11:22:33 → Sidon, Lebanon
DD:EE:FF:44:55:66 → Sidon, Lebanon
```

Using several routers and their signal strengths, it estimates your position.

---

### 2. Reading the IP address

Every device connected to the internet has a public IP address assigned by the ISP.

Example:

```text
Public IP: 185.xxx.xxx.xxx
```

The location service checks databases that map IP ranges to approximate areas:

```text
185.xxx.xxx.xxx → Sidon, Lebanon
```

IP geolocation is much less accurate than Wi-Fi:

* Sometimes accurate to a city
* Sometimes only to a region or country

---

### 3. Using GPS (if available)

Some laptops (especially certain business laptops and 4G/5G-enabled laptops) contain a GPS receiver.

The GPS chip:

1. Receives signals from satellites.
2. Measures travel times of those signals.
3. Calculates latitude and longitude.

Example result:

```text
Latitude: 33.5606
Longitude: 35.3756
Accuracy: 3 meters
```

Most ordinary laptops **do not have GPS**, so they rely mainly on Wi-Fi and IP-based positioning.

---

### Complete sequence

```text
Website
   │
   ▼
navigator.geolocation.getCurrentPosition()
   │
   ▼
Browser
   │
   ▼
Operating System Location Service
   │
   ├─ Scan nearby Wi-Fi routers
   ├─ Check public IP address
   └─ Read GPS hardware (if present)
   │
   ▼
Location Provider
   │
   ▼
Estimated latitude/longitude
   │
   ▼
Browser
   │
   ▼
Website receives coordinates
```

So when a website asks for your location, the browser is typically **not discovering your location by itself**. It relies on the operating system and location providers that use Wi-Fi router databases, IP geolocation databases, and GPS hardware (if available).

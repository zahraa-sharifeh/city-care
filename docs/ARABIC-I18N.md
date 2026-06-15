# Arabic Language Integration — City Care

This document describes how **Arabic (العربية)** is integrated into the Smart City Issue Reporting project: architecture, UI behavior, file locations, and what remains in English.

---

## 1. Overview

| Aspect | Approach |
|--------|----------|
| **Libraries** | [i18next](https://www.i18next.com/) + [react-i18next](https://react.i18next.com/) (v23 / v15) |
| **Languages** | English (`en`) — default; Arabic (`ar`) |
| **Apps** | **Citizen web** and **Admin web** — separate i18n setups (same pattern, different storage keys) |
| **Backend API** | Mostly **English** (messages, PDF export, stored category values) |
| **Direction** | Automatic **RTL** when Arabic is selected |

Arabic is a **frontend** concern: users switch language in the browser. The API does not receive a language header for translated responses.

---

## 2. Technical stack

### 2.1 Initialization

Each app loads i18n before React mounts:

```js
// citizen-web/src/index.js (and admin-web/src/index.js)
import "./i18n";
import "./index.css";
```

Configuration files:

- `citizen-web/src/i18n/index.js`
- `admin-web/src/i18n/index.js`

Both files:

1. Import `en.json` and `ar.json`.
2. Register them as `translation` namespaces.
3. Set **fallback** to English if a key is missing.
4. Read the saved language from **localStorage** on startup.
5. On every language change, update `document.documentElement.lang` and `dir`.

```js
function applyDocumentLanguage(lng) {
  const isRtl = lng === "ar";
  document.documentElement.lang = lng;
  document.documentElement.dir = isRtl ? "rtl" : "ltr";
}

const saved = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
const initialLng = saved === "ar" || saved === "en" ? saved : "en";

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ar: { translation: ar },
  },
  lng: initialLng,
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

i18n.on("languageChanged", lng => {
  localStorage.setItem(STORAGE_KEY, lng);
  applyDocumentLanguage(lng);
});
```

**Persistence keys** (citizen and admin choices are stored separately):

| App | localStorage key |
|-----|------------------|
| Citizen | `citycare_lang` |
| Admin | `citycare_admin_lang` |

---

## 3. Translation files

### 3.1 File layout

```
citizen-web/src/i18n/
  index.js
  locales/
    en.json
    ar.json

admin-web/src/i18n/
  index.js
  locales/
    en.json
    ar.json
```

Each locale file has **~470+ lines** and uses nested keys.

### 3.2 Key namespaces (examples)

| Section | Purpose |
|---------|---------|
| `lang` | Language switcher labels |
| `nav` | Menu, sign in, alerts |
| `common` | Loading, governorate, district, pagination |
| `status` | Pending, in progress, resolved, rejected |
| `categories` | All 12 issue types |
| `auth` | Login, register, password reset |
| `createReport` | GPS errors, form labels |
| `notifications` | Types, titles, status messages (citizen) |
| `home`, `map`, `discover`, `help`, … | Page-specific copy |

**Interpolation** is used for dynamic text, e.g. `{{count}}`, `{{page}}`, `{{pages}}`.

### 3.3 Example (navigation)

| Key | English | Arabic |
|-----|---------|--------|
| `nav.myReports` | My reports | بلاغاتي |
| `nav.newReport` | New report | بلاغ جديد |
| `nav.signIn` | Sign in | تسجيل الدخول |

---

## 4. Using translations in the UI

### 4.1 React components

```js
import { useTranslation } from "react-i18next";

export default function Example() {
  const { t, i18n } = useTranslation();
  return <h1>{t("reports.title")}</h1>;
}
```

**Citizen:** most pages, layout, top bar, auth, filters, and shared components use `useTranslation`.

**Admin:** reports list, report detail, analytics, district spotlight, login, layout, and related components.

### 4.2 Shared label helpers (outside React)

Some labels are resolved via the global `i18n` instance:

| Module | Purpose |
|--------|---------|
| `utils/statusLabels.js` | Report status labels + filter options |
| `utils/priorityLabels.js` | Priority labels (admin) |
| `constants/issueCategories.js` | Category labels + dropdown options |
| `utils/notificationMeta.js` | Notification titles/bodies (citizen) |
| `utils/reportShare.js` | WhatsApp/share text (admin) |

**Issue categories** keep **English values in the database** (e.g. `"Infrastructure & Roads"`). The UI shows Arabic using an `i18nKey`:

```js
export function getCategoryLabel(def) {
  return i18n.t(`categories.${def.i18nKey}`, { defaultValue: def.value });
}
```

---

## 5. Language switcher

**Component:** `src/components/LanguageSwitcher.js` (citizen and admin).

- Two buttons: **English** / **العربية**
- Active state: `lang-switcher-btn.is-active`
- Accessibility: `role="group"`, `aria-pressed`, `aria-label` from `t("lang.label")`
- Calls `i18n.changeLanguage("en" | "ar")`

**Placement:**

- Top bar (`CitizenTopBar`, authenticated `Layout`; admin `Layout`)
- Auth screens (`AuthLayout` — login/register)
- Mobile drawer footer (citizen)

---

## 6. RTL (right-to-left) layout

### 6.1 Document direction

When `ar` is selected:

- `html[dir="rtl"]`
- `html[lang="ar"]`

Navigation, drawers, forms, and icons mirror for RTL.

### 6.2 Typography

Google Fonts in `public/index.html` (both apps):

- **LTR:** Poppins
- **RTL:** Noto Sans Arabic (with Poppins fallback)

```css
/* citizen-web/src/index.css */
[dir="rtl"] body {
  font-family: "Noto Sans Arabic", "Poppins", system-ui, sans-serif;
}
```

### 6.3 CSS adjustments

`[dir="rtl"]` rules appear in:

| File | Scope |
|------|--------|
| `citizen-web/src/App.css` | Top bar, selects, help FAQ, create report, notifications |
| `citizen-web/src/styles/mobile.css` | Drawer from left, close button position |
| `citizen-web/src/styles/auth.css` | Auth form icons and selects |
| `admin-web/src/App.css` | Reports, analytics, spotlight, report detail |
| `admin-web/src/styles/mobile.css` | Mobile nav drawer |

Common fixes: flip drawer `translateX`, swap select padding, mirror chevrons and flex alignment.

---

## 7. Dates and numbers

| Area | Behavior |
|------|----------|
| **Admin** (reports, detail, analytics, spotlight) | `ar-LB` when `i18n.language === "ar"` |
| **Citizen notifications** | `notificationDateLocale()` → `ar-LB` for Arabic |
| **Some citizen pages** | `toLocaleString(undefined, …)` — browser locale; not always `ar-LB` |
| **Backend PDF export** | Fixed `en-GB` formatting |
| **API errors** | English strings |

Admin example:

```js
const dateLocale = i18n.language === "ar" ? "ar-LB" : undefined;
new Date(createdAt).toLocaleString(dateLocale, {
  dateStyle: "short",
  timeStyle: "short",
});
```

---

## 8. Translated vs not translated

### Translated in the UI (EN ↔ AR)

- Navigation, buttons, form labels, client-side validation messages
- Status and priority labels
- Issue category **display** names
- Empty states and user-facing frontend errors
- Help / FAQ, home, create report (including GPS messages)
- Notifications (citizen)
- Admin filters, analytics, district spotlight, account password

### Not translated (by design or current limitation)

| Item | Notes |
|------|--------|
| **API responses** | e.g. `"Server error"` — English from Express |
| **MongoDB location names** | Governorates/districts seeded in English |
| **Category values in DB** | Stored in English; UI label is translated |
| **Brand name** | Often `"City Care"` in both locale files |
| **PDF export** | English dates in backend |
| **Some citizen dates** | Could use `ar-LB` consistently everywhere |

---

## 9. User flow

```
User opens app
    → Read language from localStorage
    → Apply lang + dir on <html>
    → Render strings via t("key")
User taps "العربية"
    → i18n.changeLanguage("ar")
    → Save localStorage + dir=rtl
    → RTL CSS + Noto Sans Arabic apply
```

---

## 10. Dependencies

In `citizen-web/package.json` and `admin-web/package.json`:

```json
"i18next": "^23.16.8",
"react-i18next": "^15.4.1"
```

RTL is handled with `dir` on `<html>` and CSS — no separate RTL library.

---

## 11. How to add or update Arabic text

1. Add the English string in `en.json` under a clear key path.
2. Add the Arabic equivalent in `ar.json` with the **same key path**.
3. In the component: `t("your.new.key")`.
4. If layout breaks in RTL, add `[dir="rtl"]` rules in `App.css` or `styles/mobile.css`.
5. For values tied to API enums, follow `statusLabels.js` or `issueCategories.js`.
6. **Rebuild and redeploy** the frontend — `REACT_APP_*` and locale JSON are bundled at build time.

---

## 12. Related docs

- [DEPLOY-NETLIFY.md](./DEPLOY-NETLIFY.md) — production deploy (locale files ship with each build)
- [API.md](./API.md) — API messages remain English
- [README.md](../README.md) — project overview

---

## 13. Summary

Arabic integration is **client-side, bilingual, and RTL-aware**:

- **i18next** drives UI strings through parallel **EN/AR JSON** catalogs in both apps.
- **Language choice persists** per app in localStorage.
- **RTL** uses `dir` on the document, **Noto Sans Arabic**, and targeted CSS.
- **Database and API** largely use English; the UI translates statuses, categories, priorities, and page copy.

This fits a Lebanese civic app: **Arabic UX in the browser**, **English in stored data and API**, with optional future work for server-side messages and uniform `ar-LB` dates on all citizen screens.


/////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////


This paragraph explains **how Arabic language support is implemented** in the application:

### Simple explanation

* **Client-side** → The translation happens in the user's browser (frontend), not on the server.
* **Bilingual** → The app supports both **English (EN)** and **Arabic (AR)**.
* **RTL-aware** → The interface automatically adapts to Arabic's **right-to-left (RTL)** writing direction.

### Details

#### 1. i18next drives UI strings through parallel EN/AR JSON catalogs

The app uses the **i18next** library for translations.

Example:

**en.json**

```json
{
  "welcome": "Welcome",
  "submit": "Submit Report"
}
```

**ar.json**

```json
{
  "welcome": "أهلاً وسهلاً",
  "submit": "إرسال البلاغ"
}
```

When the user selects Arabic, the Arabic text is displayed automatically.

---

#### 2. Language choice persists per app in localStorage

The selected language is saved in the browser's **localStorage**.

Example:

```javascript
localStorage.setItem("language", "ar");
```

So if a user chooses Arabic today and opens the app tomorrow, it will still appear in Arabic.

---

#### 3. RTL uses dir on the document, Noto Sans Arabic, and targeted CSS

When Arabic is selected:

```html
<html dir="rtl">
```

This causes:

* Text to start from the right.
* Menus and layouts to align correctly for Arabic readers.

The app also uses **Noto Sans Arabic** font for proper Arabic rendering and custom CSS rules to adjust spacing, alignment, and UI components.

---

#### 4. Database and API largely use English

Internally, the system stores data in English.

Example database record:

```json
{
  "status": "Pending",
  "priority": "High",
  "category": "Road Damage"
}
```

But the user sees:

| Stored Value | Arabic UI    |
| ------------ | ------------ |
| Pending      | قيد الانتظار |
| High         | عالية        |
| Road Damage  | أضرار الطرق  |

The translation occurs only in the frontend.

---

### Why this approach is good for a Lebanese civic app

It provides:

* Arabic and English interfaces for citizens.
* Simpler database management (one language internally).
* Easier API development and maintenance.
* Lower storage requirements because translations are not duplicated in the database.

---

### Meaning of the final sentence

> **"Arabic UX in the browser, English in stored data and API, with optional future work for server-side messages and uniform ar-LB dates on all citizen screens."**

This means:

**Current implementation**

* Arabic translations are shown in the browser (frontend).
* Database values and API responses remain in English.

**Possible future improvements**

* Translate backend/server-generated messages as well.
* Format all dates according to Lebanese Arabic conventions (`ar-LB` locale), such as:

  * English: `May 19, 2026`
  * Arabic (Lebanon): `١٩ أيار ٢٠٢٦`

In one sentence: **Users can use the app fully in Arabic or English, while the system internally stores and processes data in English for simplicity and consistency.**

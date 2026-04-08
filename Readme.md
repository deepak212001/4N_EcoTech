# 4N Eco — Appointment Booking (Mobile + API)

This project is an **appointment booking system** for both **patients** and **providers**:

- **`app/`** — React Native mobile app (iOS + Android)
- **`server/`** — Node.js + Express REST API + MongoDB

Below is **everything the app does**, screen by screen, mapped to the backend where relevant.

---

## 1. App launch (session / login state)

| Situation | Behaviour |
|-----------|-----------|
| **First launch / logged out** | Patient login screen is shown |
| **Saved token** | JWT is read from AsyncStorage and restored |
| **Valid patient token** | `GET /api/auth/me` loads patient profile |
| **403 on `/auth/me`** | Token is treated as a **provider** token → `GET /api/providers/auth/me` |
| **401** | Token cleared; user must sign in again |
| **Patient session** | Home (dashboard) + book-appointment flow |
| **Provider session** | Provider dashboard (availability + incoming bookings) |

---

## 2. Patient — functionality per screen

### 2.1 Login (`LoginScreen`)

- Email and password
- **Sign in** → `POST /api/auth/login` — receives JWT; stored in memory and AsyncStorage
- Link: **Register** (new account)
- Link: **Login as provider** → switches to provider login

### 2.2 Register (`RegisterScreen`)

- Fields: **name**, **email**, **password** (minimum 6 characters)
- **Create account** → `POST /api/auth/register` — on success, user is logged in and session is set
- Link: back to **Login**

### 2.3 Home — patient dashboard (`HomeScreen`)

- Header: **Hi, {name}** (from session), **Logout** — clears token and persisted storage
- Button: **Book appointment** → navigates to provider list
- **My appointments** — `GET /api/appointments` (provider name populated where applicable)
- Each card: provider name, **date · time**, status **Booked** or **Cancelled**
- For **Booked** items: **Cancel** — `DELETE /api/appointments/:id` (only the patient’s own booking)
- Pull-to-**refresh** reloads the list
- Empty state: “No appointments yet.”

### 2.4 Provider list (`ProviderListScreen`)

- `GET /api/providers` — all providers
- Each row: **round profile image**, **name**, **category** (`image` URL from API; default avatar if missing)
- Tap → **Provider detail** for that provider id

### 2.5 Provider detail and booking (`ProviderDetailScreen`)

- `GET /api/providers/:id` — provider info + **available slots** (slots already booked are filtered out)
- Large **profile photo**, name, category
- **Available slots**: grouped by date; time chips; user selects one slot
- **Confirm booking** → `POST /api/appointments` with `{ providerId, date, time }`
- Duplicate slot → server responds with **409**
- Success: alert “Booked”, then back to patient flow

---

## 3. Provider — functionality per screen

### 3.1 Provider login (`ProviderLoginScreen`)

- Email and password
- **Sign in as provider** → `POST /api/providers/auth/login` — JWT saved
- Link to **Provider register**
- **Back** → patient login

### 3.2 Provider register (`ProviderRegisterScreen`)

- Fields: **practice/name**, **category**, **email**, **password** (min 6 characters)
- **Optional profile photo**: Choose / Change / Remove — device gallery (`react-native-image-picker`), with preview
- If a photo is chosen, **`imageBase64`** (data URI) is sent in JSON to `POST /api/providers/auth/register`
- Server uploads to **Cloudinary** and stores the image URL in the database
- On success: provider session and dashboard

### 3.3 Provider dashboard (`ProviderDashboardScreen`)

- **Your availability**
  - Pick a **date** (calendar / date picker)
  - Add **time slots** (platform-specific date/time pickers)
  - Merge days and slots into a schedule; remove a day or individual times
  - **Save** → `PUT /api/providers/auth/slots` — replaces the full `availableSlots` array (server normalizes and rejects duplicate dates)
- **Who booked with you**
  - `GET /api/providers/auth/appointments` — patients who booked; user fields populated as returned by the API
- Pull to refresh, loading and error states
- **Logout**

---

## 4. Backend API (routes → purpose)

Base path: **`/api`** (mounted in server `app.js`)

### Auth (patient) — `/api/auth`

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/register` | — | Patient registration + JWT |
| POST | `/login` | — | Patient login + JWT |
| POST | `/logout` | — | As implemented |
| GET | `/me` | Bearer (patient) | Current user profile |

### Providers — `/api/providers`

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/` | — | List all providers (Mongo documents include `image`, `category`, etc.) |
| GET | `/:id` | — | One provider + **availableSlots** (booked slots excluded from availability) |
| POST | `/auth/register` | — | Provider registration; optional **`imageBase64`** → Cloudinary |
| POST | `/auth/login` | — | Provider JWT |
| GET | `/auth/me` | Bearer (provider) | Provider profile (`image`, `availableSlots`, etc.) |
| PUT | `/auth/slots` | Bearer (provider) | Replace full availability |
| GET | `/auth/appointments` | Bearer (provider) | Bookings for this provider’s practice |

### Appointments (patient) — `/api/appointments`

All routes require **patient JWT** (`verifyAuth`).

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/` | Create booking — duplicate slot check |
| GET | `/` | List my appointments (provider populated) |
| DELETE | `/:id` | Cancel — only the owning patient |

---

## 5. Technical notes (app + server)

| Topic | Details |
|-------|---------|
| **API base URL** | `app/src/api/api.js` — `API_BASE_URL` (LAN IP + port for local dev, or deployed URL for production) |
| **Authorization** | `Bearer <token>` added automatically in `apiRequest` |
| **Provider images** | List/detail use `provider.image` URL; fallback in `app/src/constants/avatars.js` |
| **Cloudinary** | `server/api/utils/cloudinary.js`; configure `CLOUDINARY_*` in `.env` |
| **Env load order** | `server/api/loadEnv.js` is imported **first** so `process.env` is ready before Cloudinary initializes |
| **Image picker** | `patch-package` applies `app/patches/react-native-image-picker+*.patch`; `postinstall` runs `patch-package` |
| **Large JSON bodies** | Provider registration with base64 image: `express.json({ limit: '12mb' })` |

---

## 6. How to run

**Server**

```bash
cd server
npm install
# Create server/.env: PORT, MONGODB_URI, TOKEN_SECRET, CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
npm run dev
```

**App**

```bash
cd app
npm install
npm start
# In another terminal: npm run android   or   npm run ios
```

If **Android install fails**, `adb devices` must show **`device`** (not `offline` or `unauthorized`). For an emulator, create an AVD in Android Studio first.

**Optional seed**

```bash
cd server
npm run seed:providers
```

---

## 7. Security

- Do **not** commit `.env` or secrets to git.
- Use **HTTPS** and correct **CORS** in production.

---

*This README reflects the current codebase; update it when you add screens or API endpoints.*

# Dream

Direct ordering MVP for local restaurants / B2B daily essentials. Two-screen mobile UX, single-operator admin, no customer auth.

## Project layout

```
.
├── flutter_app/    Mobile client (Flutter, light + dark, glass UI)
├── backend/        Node + Express + SQLite + Gebeta Maps geocoding
├── admin/          React + Vite + Tailwind admin console (orders map, CRUD)
└── docs/           API contract + architecture notes
```

## Quick start (local dev)

### 1. Backend

```bash
cd backend
cp .env.example .env       # then fill in ADMIN_TOKEN and (optionally) GEBETA_API_KEY
npm install
npm start                  # http://localhost:4000
```

`ADMIN_TOKEN` is the bearer string both the admin web app and any direct curl calls must send. Generate one with `openssl rand -hex 32`.

### 2. Admin web app

```bash
cd admin
npm install
npm run dev                # http://localhost:5173
```

The dev server proxies `/api/*` to `http://localhost:4000` so no CORS pain in development. In production set `VITE_BACKEND_URL` to your deployed backend URL.

### 3. Flutter app

```bash
cd flutter_app
flutter pub get
# Android emulator points at the host machine's 4000 via 10.0.2.2
flutter run -d emulator-5554 --dart-define=BACKEND_URL=http://10.0.2.2:4000
# Or Chrome for a quick desktop preview
flutter run -d chrome --dart-define=BACKEND_URL=http://localhost:4000
```

## What's in the box

### Customer mobile app

- Light + dark theme toggle (top-right pill)
- Frosted-glass product rows over an ambient motif background
- Auto-scrolling ad carousel driven by the backend
- Delivery bottom sheet (phone + address + optional note) captured before order submission
- Order summary + payment instructions screen with admin-call CTA

### Backend API

- `GET  /api/ads | /api/products | /api/config`
- `POST /api/orders`  → server-side total recompute, optional Gebeta forward-geocode of the address into lat/lon
- `GET  /api/orders`
- `/api/admin/*` (Bearer auth) full CRUD for products, ads, config, plus order status transitions: `submitted → confirmed → dispatched → delivered` (+ `cancelled`)
- Storage: SQLite via `better-sqlite3`, WAL journaling, transactional order writes — no JSON-file race risk

### Admin web app

- Token-based sign-in
- Orders table with status pill + one-click status advancement
- Map view (MapLibre GL JS) plotting located orders. Defaults to Gebeta's standard style when `VITE_GEBETA_API_KEY` is set; falls back to OpenStreetMap raster tiles otherwise
- Products / Ads / Config CRUD pages

## Deployment to Railway

Two services per repo: `backend` and `admin`. Both have a `railway.json` configured for the Nixpacks builder.

1. **Push this repo to GitHub** (already wired to `origin`)
2. **Backend service**
   - Root directory: `backend`
   - Environment vars: `ADMIN_TOKEN`, `GEBETA_API_KEY`, optional `DREAM_DB_PATH=/data/dream.db` if you attach a volume
   - Attach a persistent volume mounted at `/data` to keep SQLite across deploys
3. **Admin service**
   - Root directory: `admin`
   - Environment vars:
     - `VITE_BACKEND_URL=https://<your-backend>.up.railway.app`
     - `VITE_GEBETA_API_KEY=<your-gebeta-key>` (so the admin map renders with Gebeta tiles)
4. **Flutter app**
   - Build the APK with the backend URL baked in: `flutter build apk --release --dart-define=BACKEND_URL=https://<your-backend>.up.railway.app`

## Gebeta Maps integration

The backend uses the [Gebeta](https://docs.gebeta.app/) forward geocoding endpoint to turn the customer-entered address into latitude/longitude at order-creation time. If `GEBETA_API_KEY` is unset, orders still flow through — the admin map just won't have pins for those rows.

- Forward geocoding: `GET https://mapapi.gebeta.app/api/v1/route/geocoding?name=...&apiKey=...`
- Directions / routing primitives also live under `https://mapapi.gebeta.app/api/route/...`
- Map tiles: MapLibre style URL `https://tiles.gebeta.app/styles/standard/style.json`, with `apiKey` injected on every request via MapLibre's `transformRequest`
- See `backend/src/gebeta.js` (server-side geocoding) and `admin/src/components/OrderMap.jsx` (client-side tiles).

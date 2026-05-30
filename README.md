# Dream

Direct ordering MVP for local restaurants and B2B daily essentials. The customer app has no account system; the operator uses a bearer-token admin console.

## Project Layout

```text
.
|-- flutter_app/    Customer mobile client (Flutter)
|-- backend/        Node + Express + SQLite + Gebeta Maps geocoding
|-- admin/          React + Vite + Tailwind admin console
`-- docs/           API contract and architecture notes
```

## Quick Start

### 1. Backend

```bash
cd backend
cp .env.example .env
npm install
npm start
```

The API runs at `http://localhost:4000`.

Important environment variables:

- `ADMIN_TOKEN`: required for `/api/admin/*` and protected order listing.
- `GEBETA_API_KEY`: optional; enables address geocoding.
- `DREAM_DB_PATH`: optional SQLite path override.
- `CORS_ORIGIN`: optional comma-separated browser origins for production CORS restrictions.

Generate an admin token with:

```bash
openssl rand -hex 32
```

### 2. Admin Web App

```bash
cd admin
npm install
npm run dev
```

The dev server runs at `http://localhost:5173` and proxies `/api/*` to `http://localhost:4000`.

Production environment variables:

- `VITE_BACKEND_URL=https://<your-backend>.up.railway.app`
- `VITE_GEBETA_API_KEY=<your-gebeta-key>`

### 3. Flutter App

```bash
cd flutter_app
flutter pub get
flutter run -d emulator-5554 --dart-define=BACKEND_URL=http://10.0.2.2:4000
```

For a Chrome preview:

```bash
flutter run -d chrome --dart-define=BACKEND_URL=http://localhost:4000
```

## Features

### Customer App

- Light/dark theme toggle.
- Product quantity selection.
- Backend-driven ad carousel.
- Delivery phone/address capture before order submission.
- Checkout summary with Telebirr scan-to-pay UI, payment instructions, and admin-call CTA.

### Backend API

- Public reads: `GET /api/ads`, `GET /api/products`, `GET /api/config`.
- Public order creation: `POST /api/orders`.
- Protected order listing: `GET /api/orders` and `GET /api/admin/orders`.
- Admin CRUD for products, ads, and config.
- Guarded order status workflow: `submitted -> confirmed -> dispatched -> delivered`, with cancellation before delivery.
- SQLite persistence through `better-sqlite3`, WAL journaling, and transactional order writes.
- Server-side total recomputation; client-supplied item names/prices are ignored.
- Telebirr payment config supports merchant name, account phone, and a real merchant QR image URL.

### Admin Console

- Token-based sign-in.
- Orders table with status pills and workflow actions.
- MapLibre order map with Gebeta tiles when configured and OpenStreetMap fallback otherwise.
- Products, ads, and config management.
- Lazy-loaded routes and isolated MapLibre chunk for a smaller initial bundle.

## Quality Gates

```bash
cd backend
npm test
```

```bash
cd admin
npm run build
```

```bash
cd flutter_app
flutter analyze
flutter test
```

## Deployment To Railway

Use two Railway services from the same repository. The exact service setup, variables, CI gates, and optional GitHub Actions deployment workflow are documented in `docs/RAILWAY_DEPLOYMENT.md`.

### Backend Service

- Root directory: `backend`
- Required env: `ADMIN_TOKEN`
- Recommended env: `CORS_ORIGIN=https://<your-admin>.up.railway.app`
- Optional env: `GEBETA_API_KEY`, `DREAM_DB_PATH=/data/dream.db`
- Attach a persistent volume mounted at `/data` when using `DREAM_DB_PATH=/data/dream.db`.

### Admin Service

- Root directory: `admin`
- Env: `VITE_BACKEND_URL=https://<your-backend>.up.railway.app`
- Optional env: `VITE_GEBETA_API_KEY=<your-gebeta-key>`

### Flutter Release Build

```bash
flutter build apk --release --dart-define=BACKEND_URL=https://<your-backend>.up.railway.app
```

## Deployment To Firebase

Firebase is now the lower-cost deployment path. It uses Firebase Hosting for the admin app, Cloud Functions for the API, and Firestore for persistent data. See `docs/FIREBASE_DEPLOYMENT.md`.

Current Firebase Hosting URL:

```text
https://dream-direct-480614.web.app
```

```bash
cd admin
npm ci
npm run build
cd ..
firebase deploy --only hosting,functions
```

Build the Android app against Firebase Hosting:

```bash
cd flutter_app
flutter build apk --release --dart-define=BACKEND_URL=https://<project-id>.web.app
```

## Gebeta Maps Integration

The backend uses Gebeta forward geocoding to convert customer-entered delivery addresses into coordinates. If `GEBETA_API_KEY` is unset, orders still succeed; they simply do not get map pins unless the client supplies valid `lat` and `lon`.

The admin map uses MapLibre. When `VITE_GEBETA_API_KEY` is set, requests to Gebeta tile/style resources include the API key. Without it, the map falls back to OpenStreetMap raster tiles.

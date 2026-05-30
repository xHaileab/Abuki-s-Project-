# Dream Architecture

## Goal

Dream is a direct-ordering MVP for local restaurants and daily essentials. The customer flow intentionally avoids account creation, while the operator gets a small authenticated admin console for catalog, ads, config, order status, and map visibility.

## Components

1. **Flutter app (`flutter_app`)**
   - Customer ordering experience.
   - State management via `provider` and `OrderProvider`.
   - Reads ads, products, and checkout config from the backend.
   - Collects phone and delivery address before submitting an order.
   - Displays the submitted order summary and admin-call action.

2. **Backend API (`backend`)**
   - Express REST API.
   - SQLite persistence through `better-sqlite3`.
   - Server-side total recomputation for every order.
   - Optional Gebeta forward geocoding for delivery addresses.
   - Shared bearer-token auth for `/api/admin/*` and the legacy `/api/orders` listing.

3. **Admin web app (`admin`)**
   - React + Vite + Tailwind.
   - Token-based sign-in against the backend `ADMIN_TOKEN`.
   - Products, ads, and config management.
   - Order table with guarded status transitions.
   - Order map using Gebeta/MapLibre when configured, with an OpenStreetMap fallback.

## Persistence

The backend stores data in SQLite at `backend/data/dream.db` by default. Production deployments should set `DREAM_DB_PATH` to a persistent volume path, for example `/data/dream.db` on Railway.

Tables:

- `products`
- `ads`
- `config`
- `orders`
- `order_items`

Fresh databases are seeded from `backend/data/seed.json`.

## Request Flow

1. The app starts and fetches `/api/ads`, `/api/products`, and `/api/config`.
2. The customer selects quantities locally.
3. The customer enters delivery phone/address.
4. The app posts `items`, `total`, and delivery details to `POST /api/orders`.
5. The backend validates input, recomputes the total, optionally geocodes the address, and writes the order transactionally.
6. The admin console reads orders via authenticated `/api/admin/orders`.
7. Operators advance orders through `submitted -> confirmed -> dispatched -> delivered`, or cancel before delivery.

## Security And Privacy

- Admin APIs require `Authorization: Bearer <ADMIN_TOKEN>`.
- `GET /api/orders` is kept only as a protected legacy alias; public order listing is intentionally disabled because orders contain phone/address data.
- `CORS_ORIGIN` can restrict browser origins in production. Leave it blank only for local/mobile development.
- The backend ignores client-supplied item names/prices and recomputes trusted totals from the product catalog.
- Admin writes reject unsupported fields and unsafe image URL schemes.

## Quality Gates

Backend:

```bash
cd backend
npm test
```

Admin:

```bash
cd admin
npm run build
```

Flutter:

```bash
cd flutter_app
flutter analyze
flutter test
```

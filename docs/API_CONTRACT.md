# Dream API Contract

Base URL: `http://localhost:4000`

## Common

- Request/response content type: `application/json`
- Success envelope: `{ "data": ... }`
- Error envelope: `{ "error": "..." }`
- Admin auth: `Authorization: Bearer <ADMIN_TOKEN>`

## Public Customer Endpoints

### `GET /health`

Returns service discovery flags.

```json
{
  "ok": true,
  "service": "dream-backend",
  "adminEnabled": true,
  "gebetaConfigured": false,
  "corsRestricted": true
}
```

### `GET /api/ads`

Returns ad carousel data.

```json
{
  "data": [
    {
      "id": "ad-1",
      "title": "Rophnan Sidest Concert",
      "subtitle": "Millennium Hall | Bole, Addis Ababa",
      "tag": "Concert",
      "imageUrl": "http://localhost:4000/static/images/design_ad.jpg"
    }
  ]
}
```

### `GET /api/products`

Returns orderable products.

```json
{
  "data": [
    {
      "id": "prd-onion",
      "name": "Onion",
      "price": 50,
      "imageUrl": null,
      "sortOrder": 0
    }
  ]
}
```

### `GET /api/config`

Returns checkout configuration.

```json
{
  "data": {
    "adminPhone": "+251911223344",
    "paymentInstructions": "Open telebirr, scan the QR code, pay the exact total, then call admin.",
    "telebirrMerchantName": "Dream Direct Orders",
    "telebirrPhone": "+251911223344",
    "telebirrQrImageUrl": "http://localhost:4000/static/images/your-telebirr-qr.png"
  }
}
```

### `POST /api/orders`

Creates an order. The backend recomputes all product names, prices, and totals from the catalog.

Required fields:

- `items`: non-empty array, max 50
- `items[].productId`: existing product id
- `items[].quantity`: integer from 1 to 999
- `customerPhone`: non-empty string
- `address`: non-empty string

Optional fields:

- `total`: checked against the server-computed total when provided
- `customerName`
- `addressNote`
- `lat` and `lon`: must be supplied together and must be valid coordinates

Request:

```json
{
  "items": [
    { "productId": "prd-onion", "quantity": 2 },
    { "productId": "prd-chili", "quantity": 1 }
  ],
  "total": 220,
  "customerName": "Abel",
  "customerPhone": "+251911111111",
  "address": "Bole, near Edna Mall, Addis Ababa",
  "addressNote": "Call at the gate"
}
```

Response `201`:

```json
{
  "data": {
    "id": "ORD-0C710326",
    "status": "submitted",
    "items": [
      { "productId": "prd-onion", "name": "Onion", "price": 50, "quantity": 2 },
      { "productId": "prd-chili", "name": "Chili", "price": 120, "quantity": 1 }
    ],
    "total": 220,
    "customerName": "Abel",
    "customerPhone": "+251911111111",
    "address": "Bole, near Edna Mall, Addis Ababa",
    "addressNote": "Call at the gate",
    "lat": null,
    "lon": null,
    "createdAt": "2026-05-20T12:30:00.000Z",
    "updatedAt": "2026-05-20T12:30:00.000Z"
  }
}
```

Common `400` examples:

```json
{ "error": "items must be a non-empty array" }
```

```json
{ "error": "customerPhone required" }
```

```json
{ "error": "Total mismatch", "expectedTotal": 220 }
```

## Admin Endpoints

All admin endpoints require `Authorization: Bearer <ADMIN_TOKEN>`.

### `GET /api/orders`

Protected legacy alias for order listing. Kept for direct curl/admin workflows. It is not a public endpoint.

### `GET /api/admin/orders`

Returns newest-first order list. Optional query: `?status=submitted`.

### `GET /api/admin/orders/:id`

Returns one order or `404`.

### `PATCH /api/admin/orders/:id`

Updates status. Allowed workflow:

```text
submitted -> confirmed -> dispatched -> delivered
```

`cancelled` is allowed from `submitted`, `confirmed`, or `dispatched`. Final states are `delivered` and `cancelled`.

Request:

```json
{ "status": "confirmed" }
```

Invalid workflow response `409`:

```json
{ "error": "Cannot transition order from submitted to dispatched" }
```

### Products

- `GET /api/admin/products`
- `POST /api/admin/products`
- `PATCH /api/admin/products/:id`
- `DELETE /api/admin/products/:id`

Create/update fields:

- `name`: required on create, non-empty when updated
- `price`: non-negative number
- `imageUrl`: `http(s)` URL, `/static/...` path, or `null`

### Ads

- `GET /api/admin/ads`
- `POST /api/admin/ads`
- `PATCH /api/admin/ads/:id`
- `DELETE /api/admin/ads/:id`

Create/update fields:

- `title`: required on create, non-empty when updated
- `subtitle`
- `tag`
- `imageUrl`: `http(s)` URL, `/static/...` path, or `null`

### Config

- `GET /api/admin/config`
- `PUT /api/admin/config`

Accepted config keys:

- `adminPhone`
- `paymentInstructions`
- `telebirrMerchantName`
- `telebirrPhone`
- `telebirrQrImageUrl`: `http(s)` URL, `/static/...` path, or empty string. This must point to the real merchant/account QR image from telebirr.

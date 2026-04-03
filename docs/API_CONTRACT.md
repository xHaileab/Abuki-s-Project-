# Dream API Contract

Base URL (default): `http://localhost:4000`

## Common

- Content type: `application/json`
- Success envelope: `{ "data": ... }`
- Error envelope: `{ "error": "..." }`

---

## GET `/api/ads`

Returns ad carousel data.

### Response 200

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

---

## GET `/api/products`

Returns orderable products with price. `imageUrl` is optional and may be `null`.

### Response 200

```json
{
  "data": [
    {
      "id": "prd-onion",
      "name": "Onion",
      "price": 50,
      "imageUrl": null
    }
  ]
}
```

---

## GET `/api/config`

Returns checkout configuration.

### Response 200

```json
{
  "data": {
    "adminPhone": "+251911223344",
    "paymentInstructions": "1) Send payment ... 2) Keep reference ... 3) Call admin with order ID ..."
  }
}
```

---

## POST `/api/orders`

Creates a new order from selected items.

### Request body

```json
{
  "items": [
    {
      "productId": "prd-onion",
      "quantity": 2
    },
    {
      "productId": "prd-chili",
      "quantity": 1
    }
  ],
  "total": 220
}
```

### Validation rules

- `items` must be a non-empty array
- Each `productId` must exist
- `quantity` must be a positive integer
- `total` (if provided) must match server-computed total within a small tolerance

### Response 201

```json
{
  "data": {
    "id": "ORD-0C710326",
    "status": "submitted",
    "items": [
      {
        "productId": "prd-onion",
        "name": "Onion",
        "price": 50,
        "quantity": 2
      },
      {
        "productId": "prd-chili",
        "name": "Chili",
        "price": 120,
        "quantity": 1
      }
    ],
    "total": 220,
    "createdAt": "2026-04-03T09:25:03.482Z"
  }
}
```

### Error 400 examples

```json
{ "error": "items must be a non-empty array" }
```

```json
{ "error": "Invalid productId: unknown" }
```

```json
{ "error": "Total mismatch", "expectedTotal": 220 }
```

---

## GET `/api/orders`

Returns newest-first order list for simple admin viewing.

### Response 200

```json
{
  "data": [
    {
      "id": "ORD-0C710326",
      "status": "submitted",
      "items": [
        { "productId": "prd-onion", "name": "Onion", "price": 50, "quantity": 2 }
      ],
      "total": 100,
      "createdAt": "2026-04-03T09:25:03.482Z"
    }
  ]
}
```

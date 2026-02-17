# AquaCare Backend API Endpoints

**Base URL:** `http://localhost:3000/api`

## Authentication (`/auth`)
| Method | Endpoint | Authenticated | Description |
| :--- | :--- | :--- | :--- |
| POST | `/auth/signup` | No | Register a new user |
| POST | `/auth/login` | No | Login user |
| POST | `/auth/refresh` | No | Refresh access token |
| POST | `/auth/logout` | Yes | Logout user |
| GET | `/auth/me` | Yes | Get current user details |

## Catalog (Services & Products)
| Method | Endpoint | Authenticated | Description |
| :--- | :--- | :--- | :--- |
| GET | `/services` | No | List all services |
| GET | `/services/:id` | No | Get service details |
| GET | `/products` | No | List all products |
| GET | `/products/:id` | No | Get product details |

## Cart (`/cart`)
*All endpoints require authentication.*

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| GET | `/cart` | Get user's open cart with hydrated item details |
| POST | `/cart/items` | Add item to cart (upsert qty for same product) |
| PATCH | `/cart/items/:id` | Update cart item (`qty: 0` removes item) |
| DELETE | `/cart/items/:id` | Remove item from cart |

### Cart Response Shape (GET `/cart`)
```json
{
  "success": true,
  "data": {
    "cart_id": 8,
    "status": "open",
    "items": [
      {
        "cart_item_id": 23,
        "cart_id": 8,
        "item_type": "product",
        "product_id": 12,
        "qty": 2,
        "unit_price": 299,
        "line_total": 598,
        "product": {
          "id": 12,
          "name": "RO Pre Filter",
          "price": 299,
          "image_url": "https://..."
        }
      }
    ]
  }
}
```

### Add Product Item (POST `/cart/items`)
Request:
```json
{
  "item_type": "product",
  "product_id": 12,
  "qty": 1
}
```

## Bookings (`/bookings`)
*All endpoints require authentication.*

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| GET | `/bookings` | List user's bookings |
| POST | `/bookings` | Create a new booking |
| PATCH | `/bookings/:id/cancel` | Cancel a booking |

## Orders (`/orders`)
*All endpoints require authentication.*

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| GET | `/orders` | List user's orders (summary cards) |
| GET | `/orders/:id` | Get order details (address + items) |
| POST | `/orders/checkout` | Checkout and place order (supports optional `referral_code`) |

### Status Bucket Mapping
- `active`: `pending`, `confirmed`, `paid`, `processing`, `packed`, `shipped`
- `delivered`: `delivered`, `completed`
- `cancelled`: `cancelled`, `refunded`

### Orders List Shape (GET `/orders`)
```json
{
  "success": true,
  "data": [
    {
      "id": 3,
      "status": "pending",
      "status_bucket": "active",
      "payment_status": "pending",
      "subtotal": 290,
      "delivery_fee": 50,
      "discount": 0,
      "total_amount": 340,
      "created_at": "2026-02-17T12:13:10.000Z",
      "item_count": 2,
      "first_item": {
        "product_name": "RO Membrane",
        "image_url": "https://..."
      }
    }
  ]
}
```

### Order Detail Shape (GET `/orders/:id`)
```json
{
  "success": true,
  "data": {
    "id": 3,
    "status": "pending",
    "status_bucket": "active",
    "payment_status": "pending",
    "subtotal": 290,
    "delivery_fee": 50,
    "discount": 0,
    "total_amount": 340,
    "created_at": "2026-02-17T12:13:10.000Z",
    "address": {
      "id": 20,
      "line1": "12 Lake Road",
      "city": "Hyderabad",
      "state": "Telangana",
      "postal_code": "500001"
    },
    "items": [
      {
        "id": 5,
        "order_id": 3,
        "product_id": 8,
        "product_name": "RO Membrane",
        "qty": 1,
        "unit_price": 180,
        "line_total": 180,
        "image_url": "https://..."
      }
    ]
  }
}
```

## Wallet (`/wallet`)
*All endpoints require authentication.*

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| GET | `/wallet` | Get wallet balance and info |
| GET | `/wallet/transactions` | List wallet transactions |

## User Profile (`/user`)
*All endpoints require authentication.*

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| GET | `/user/profile` | Get user profile |
| PATCH | `/user/profile` | Update user profile |
| GET | `/user/addresses` | List saved addresses |
| POST | `/user/addresses` | Add a new address |
| PATCH | `/user/addresses/:id` | Update an address |
| DELETE | `/user/addresses/:id` | Delete an address |

## Agent Module (`/agent`)
*All endpoints require authentication and role `agent`.*

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| GET | `/agent/me` | Get agent profile with KYC summary (creates default profile if missing) |
| POST | `/agent/kyc` | Upload one or more KYC documents (multipart) |
| PATCH | `/agent/online` | Set online/offline status (approved agents only) |
| GET | `/agent/jobs/available` | List available jobs for the agent |
| POST | `/agent/jobs/:id/accept` | Accept and assign a booking to current agent |
| POST | `/agent/jobs/:id/reject` | Reject a booking offer for current agent |
| PATCH | `/agent/jobs/:id/status` | Update assigned job status (`in_progress`, `completed`) |
| GET | `/agent/earn/referral` | Get current agent referral code |
| GET | `/agent/earn/summary` | Get commission + bonus totals and active campaign progress |
| GET | `/agent/earn/campaigns` | List active commission campaigns with tiers |
| GET | `/agent/earn/products` | List product commission previews for active campaign |
| GET | `/agent/earn/progress/:campaignId` | Get campaign progress for current agent |

### Agent KYC `doc_type`
Accepted canonical values:
- `aadhaar`
- `pan`
- `driving_license`
- `selfie`
- `other`

Accepted aliases:
- `government_id` -> `other`
- `license` -> `driving_license`

### Agent curl examples
```bash
# Agent profile + KYC summary
curl http://localhost:3000/api/agent/me \
  -H "Authorization: Bearer <TOKEN>"
```

```bash
# Upload KYC documents (multipart)
curl -X POST http://localhost:3000/api/agent/kyc \
  -H "Authorization: Bearer <TOKEN>" \
  -F "doc_type=aadhaar" \
  -F "documents=@/absolute/path/id-front.jpg" \
  -F "documents=@/absolute/path/id-back.jpg"
```

```bash
# Upload using alias (will map to canonical driving_license)
curl -X POST http://localhost:3000/api/agent/kyc \
  -H "Authorization: Bearer <TOKEN>" \
  -F "doc_type=license" \
  -F "documents=@/absolute/path/license.jpg"
```

```bash
# Online toggle (only approved agents)
curl -X PATCH http://localhost:3000/api/agent/online \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"is_online":true}'
```

```bash
# Available jobs
curl http://localhost:3000/api/agent/jobs/available \
  -H "Authorization: Bearer <TOKEN>"
```

```bash
# Accept job
curl -X POST http://localhost:3000/api/agent/jobs/123/accept \
  -H "Authorization: Bearer <TOKEN>"
```

```bash
# Reject job
curl -X POST http://localhost:3000/api/agent/jobs/123/reject \
  -H "Authorization: Bearer <TOKEN>"
```

```bash
# Status progression
curl -X PATCH http://localhost:3000/api/agent/jobs/123/status \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"status":"in_progress"}'

curl -X PATCH http://localhost:3000/api/agent/jobs/123/status \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"status":"completed"}'
```

```bash
# Checkout with optional referral code attribution
curl -X POST http://localhost:3000/api/orders/checkout \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"address_id":1,"payment_method":"cod","referral_code":"AG9AB12"}'
```

```bash
# Cart + Orders verification flow
# 1) Add product to cart (upsert behavior)
curl -X POST http://localhost:3000/api/cart/items \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"item_type":"product","product_id":1,"qty":1}'

# 2) Fetch cart
curl http://localhost:3000/api/cart \
  -H "Authorization: Bearer <TOKEN>"

# 3) Update qty (qty=0 removes item)
curl -X PATCH http://localhost:3000/api/cart/items/23 \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"qty":2}'

# 4) Checkout
curl -X POST http://localhost:3000/api/orders/checkout \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"address_id":1,"payment_method":"cod"}'

# 5) List orders
curl http://localhost:3000/api/orders \
  -H "Authorization: Bearer <TOKEN>"

# 6) Order detail
curl http://localhost:3000/api/orders/3 \
  -H "Authorization: Bearer <TOKEN>"
```

```bash
# Agent referral + earning endpoints
curl http://localhost:3000/api/agent/earn/referral -H "Authorization: Bearer <TOKEN>"
curl http://localhost:3000/api/agent/earn/summary -H "Authorization: Bearer <TOKEN>"
curl http://localhost:3000/api/agent/earn/campaigns -H "Authorization: Bearer <TOKEN>"
curl http://localhost:3000/api/agent/earn/products -H "Authorization: Bearer <TOKEN>"
curl http://localhost:3000/api/agent/earn/progress/1 -H "Authorization: Bearer <TOKEN>"
```

## Dealer Module (`/dealer`)
*All endpoints require authentication and role `dealer`.*

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| GET | `/dealer/me` | Get dealer profile + KYC summary (auto-creates profile if missing) |
| POST | `/dealer/kyc` | Upload one or more KYC documents (multipart) |
| PATCH | `/dealer/status` | Update dealer business metadata |
| GET | `/dealer/pricing/products` | List product dealer pricing preview (approved dealers only) |
| GET | `/dealer/pricing/:productId` | Get dealer pricing breakdown for one product (approved dealers only) |

### Dealer verification gating
- `GET /dealer/pricing/products` and `GET /dealer/pricing/:productId` return `403` unless `dealer_profiles.verification_status = 'approved'`.
- KYC submission sets `dealer_profiles.verification_status = 'pending'`.

### Dealer curl examples
```bash
# Login as dealer
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"dealer@example.com","password":"password123","role":"dealer"}'
```

```bash
# Dealer profile + KYC summary
curl http://localhost:3000/api/dealer/me \
  -H "Authorization: Bearer <TOKEN>"
```

```bash
# Upload dealer KYC docs (multipart)
curl -X POST http://localhost:3000/api/dealer/kyc \
  -H "Authorization: Bearer <TOKEN>" \
  -F "doc_type=gst_certificate" \
  -F "documents=@/absolute/path/gst-certificate.jpg" \
  -F "documents=@/absolute/path/business-proof.pdf"
```

```bash
# Update dealer business profile fields
curl -X PATCH http://localhost:3000/api/dealer/status \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"business_name":"Aqua Dealers LLP","gst_number":"29ABCDE1234F1Z5","address_text":"12 Industrial Rd, Bengaluru"}'
```

```bash
# Dealer pricing list (returns 403 until approved)
curl http://localhost:3000/api/dealer/pricing/products \
  -H "Authorization: Bearer <TOKEN>"
```

```bash
# Single product dealer pricing
curl http://localhost:3000/api/dealer/pricing/12 \
  -H "Authorization: Bearer <TOKEN>"
```

### Admin review note (current backend)
- Admin routes are not currently wired in this backend.
- For local testing, approve a dealer manually:

```sql
UPDATE dealer_profiles
SET verification_status = 'approved'
WHERE user_id = <DEALER_USER_ID>;
```

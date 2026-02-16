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
| GET | `/cart` | Get user's cart |
| POST | `/cart/items` | Add item to cart |
| PATCH | `/cart/items/:id` | Update cart item (quantity) |
| DELETE | `/cart/items/:id` | Remove item from cart |

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
| GET | `/orders` | List user's orders |
| GET | `/orders/:id` | Get order details |
| POST | `/orders/checkout` | Checkout and place order (supports optional `referral_code`) |

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
# Agent referral + earning endpoints
curl http://localhost:3000/api/agent/earn/referral -H "Authorization: Bearer <TOKEN>"
curl http://localhost:3000/api/agent/earn/summary -H "Authorization: Bearer <TOKEN>"
curl http://localhost:3000/api/agent/earn/campaigns -H "Authorization: Bearer <TOKEN>"
curl http://localhost:3000/api/agent/earn/products -H "Authorization: Bearer <TOKEN>"
curl http://localhost:3000/api/agent/earn/progress/1 -H "Authorization: Bearer <TOKEN>"
```

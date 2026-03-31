# IonCare Backend Static Audit Report

Date: 2026-03-31
Scope: Node.js + Express + MySQL backend static audit
Mode: Read-only code audit summary packaged into a standalone report

## 1. System Summary

- Completion estimate: about 65%
- Launch readiness: Not Ready
- Build status: `npm run build` passes

### Major working modules

- JWT access-token authentication and role-based route protection
- Password login, OTP login/session flow, password reset flow
- Customer profile and address CRUD
- Technician profile/KYC scaffolding
- Booking creation, technician acceptance, job status updates, booking updates timeline
- Store/catalog read APIs

### Major missing or incomplete areas

- Complete schema/bootstrap for a fresh environment
- Stable order lifecycle from checkout to fulfillment
- Consistent payment status handling across orders and bookings
- Reliable Razorpay webhook verification path
- Full schema support for referral/commission flows
- API/docs consistency

## 2. What Is Implemented

### Authentication & Authorization

- `src/middlewares/auth.middleware.ts`
  - Bearer-token authentication
  - role checks via `authorize` and `requireRole`
- `src/services/auth.service.ts`
  - password signup/login
  - refresh session rotation
  - OTP signup/login session flow
  - password reset email flow
- `src/routers/auth.routes.ts`
  - exposes signup, login, OTP, refresh, logout, forgot-password, reset-password, me

### Bookings

- `src/services/bookings.service.ts`
  - booking creation
  - cancellation
  - customer booking list/detail
  - booking updates fetch
  - nearby-technician fan-out after confirmation
- `src/services/technician.service.ts`
  - accept/reject jobs
  - status transitions `assigned -> in_progress -> completed`
  - technician booking updates

### Technician system

- `src/services/technician.service.ts`
  - online/offline toggle
  - location update
  - available jobs query
  - KYC submission
- `src/models/technician.model.ts`
  - radius-based distance query
  - active-job checks
  - technician profile bootstrap

### Orders / Checkout

- `src/services/orders.service.ts`
  - cart-to-order checkout
  - wallet payment path
  - order list/detail
  - cancellation path
- `src/models/order.model.ts`
  - order read models for list/detail

### Admin

- `src/routers/admin.routes.ts`
  - admin routes are actually wired and protected
- `src/controllers/admin.controller.ts`
  - KYC review
  - booking assignment/cancellation
  - product/category/brand/service/banner administration
  - order listing/detail/status update

## 3. What Is Partially Implemented

### Token refresh flow

- Session rotation exists in `src/services/auth.service.ts`
- But refresh-token verification is only session-table based, not JWT-signature based
- Expiry persistence is hardcoded to 7 days instead of tracking `JWT_REFRESH_EXPIRY`

### Order lifecycle

- Checkout exists
- Admin order status update exists
- Payment verification exists
- But these parts do not agree on state transitions

### Booking payment model

- Payment routes exist for bookings
- Booking creation now hardcodes COD-style confirmed bookings
- Both flows exist side by side and are not fully aligned

### Dealer/referral/commission features

- Code paths exist
- Some tables are conditionally handled
- But required commission tables are not defined in repo schema/bootstrap

## 4. Critical Issues (Must Fix Before Launch)

### 4.1 Incomplete schema for fresh deployment

- Files:
  - `schema.sql`
  - `src/config/launch-schema.ts`
  - `src/models/auth-otp-session.model.ts`
  - `src/models/dealer.model.ts`
- Problem:
  - `schema.sql` only defines 13 base tables and stops before many tables the app requires.
  - It also references `products(id)` before `products` is defined.
  - Runtime code requires many more tables than the repo provisions.
- Missing from repo schema/bootstrap but actively used in code:
  - `orders`
  - `order_items`
  - `payments`
  - `carts`
  - `cart_items`
  - `wallets`
  - `wallet_transactions`
  - `push_tokens`
  - `user_benefits`
  - `otp_verifications`
  - `products`
  - `brands`
  - `product_categories`
  - `banners`
  - `admin_activity_log`
  - `technician_commissions`
  - `technician_commission_bonuses`
  - `commission_campaigns`
  - `commission_rules`
  - `commission_tiers`
- Why it breaks:
  - Fresh environments cannot be reliably created.
  - Multiple endpoints will fail with missing-table or missing-column errors.

### 4.2 Booking creation depends on columns not present in base schema

- Files:
  - `src/services/bookings.service.ts`
  - `schema.sql`
  - `migrations/011_add_payment_method_to_bookings.sql`
- Problem:
  - Booking create inserts `payment_method` and `payment_status`.
  - Base `bookings` schema in `schema.sql` does not include those columns.
  - `ensureLaunchSchema()` also does not add them.
- Why it breaks:
  - On a clean DB, `POST /api/bookings` can fail immediately with `Unknown column`.

### 4.3 Order states are internally inconsistent

- Files:
  - `src/services/orders.service.ts`
  - `src/controllers/admin.controller.ts`
- Problem:
  - Checkout inserts orders as `status = 'pending'`.
  - Admin order transition map only allows:
    - `paid -> packed/cancelled`
    - `packed -> shipped/cancelled`
    - `shipped -> delivered`
- Why it breaks:
  - New orders can exist in a state that admin fulfillment cannot advance.
  - This blocks real order operations.

### 4.4 Online payment does not update `payment_status` on orders

- Files:
  - `src/controllers/payment.controller.ts`
  - `src/services/orders.service.ts`
- Problem:
  - Online payment verification updates `orders.status = 'paid'`.
  - It does not update `orders.payment_status`.
  - Order cancellation refund logic checks `order.payment_status === 'paid'`.
- Why it breaks:
  - A successfully paid online order can still look unpaid.
  - Refund logic can fail to credit the user even after successful payment.
  - Admin payment filters become inaccurate.

### 4.5 Razorpay webhook verification path is unreliable

- Files:
  - `src/gateway.ts`
  - `src/routers/payment.routes.ts`
  - `src/controllers/payment.controller.ts`
- Problem:
  - Global `express.json()` runs before the webhook route.
  - The webhook route then uses `express.raw()`, but the original raw bytes are already consumed.
  - Signature validation depends on exact raw request bytes.
- Why it breaks:
  - Real Razorpay webhooks can fail signature verification.
  - Capture/failure/refund synchronization may silently stop working.

### 4.6 Server can start while DB/bootstrap is broken

- Files:
  - `src/server.ts`
  - `src/config/db.ts`
  - `src/gateway.ts`
- Problem:
  - DB connection failures only log.
  - launch-schema bootstrap failures only log.
  - server still starts and `/health` still returns `ok`.
- Why it breaks:
  - Deployment checks can mark the service healthy while critical endpoints are unusable.

## 5. High-Risk Issues

### 5.1 Refresh token is not cryptographically verified

- File: `src/services/auth.service.ts`
- Risk:
  - Refresh flow trusts session-table presence alone.
  - JWT secret rotation or malformed-token cases are not explicitly enforced by `jwt.verify()`.

### 5.2 Session expiry is hardcoded instead of using configured refresh expiry

- File: `src/services/auth.service.ts`
- Risk:
  - `expiresAt.setDate(expiresAt.getDate() + 7)` can drift from `JWT_REFRESH_EXPIRY`.
  - DB session validity and JWT validity can diverge.

### 5.3 Wallet checkout is concurrency-sensitive

- File: `src/services/orders.service.ts`
- Risk:
  - wallet balance is checked before debit without row locking
  - concurrent checkouts can overspend balance

### 5.4 Stock is never enforced at checkout

- File: `src/services/orders.service.ts`
- Risk:
  - the service explicitly notes stock should be checked, but it is not
  - paid or pending orders can be placed for unavailable inventory

### 5.5 Referral-code checkout can fail on schema gaps

- Files:
  - `src/services/orders.service.ts`
  - `src/services/referralCommission.service.ts`
- Risk:
  - valid referral-code orders call commission-table logic
  - those commission tables are not provisioned in repo schema/bootstrap

### 5.6 Admin manual assignment ignores workload/online constraints

- File: `src/controllers/admin.controller.ts`
- Risk:
  - admin only checks approved KYC
  - it does not enforce technician online state or active-job exclusivity
  - bookings can be manually assigned to an unavailable technician

## 6. Inconsistencies

### 6.1 Docs still describe `agent`, but runtime uses `technician`

- Files:
  - `API_REFERENCE.md`
  - `api_endpoints.md`
  - `src/routers/index.ts`
- Impact:
  - integration teams following docs will hit wrong endpoints and stale field names

### 6.2 Docs say geocode is public, but route requires auth

- Files:
  - `API_REFERENCE.md`
  - `src/routers/utils.routes.ts`
- Impact:
  - client integration mismatch

### 6.3 Auth response shape is inconsistent

- Files:
  - `src/services/auth.service.ts`
  - `src/controllers/auth.controller.ts`
- Impact:
  - signup/login return DB-shaped user objects
  - `/auth/me` returns camelCase normalized object
  - frontend must handle inconsistent payloads

### 6.4 Pagination is calculated then dropped

- Files:
  - `src/controllers/bookings.controller.ts`
  - `src/controllers/orders.controller.ts`
  - `src/controllers/catalog.controller.ts`
- Impact:
  - list endpoints compute pagination in services but return only `.data`
  - API contract is inconsistent and incomplete

### 6.5 Product schema expectations conflict

- Files:
  - `src/models/product.model.ts`
  - `src/services/store.service.ts`
  - `src/controllers/admin.controller.ts`
- Impact:
  - legacy catalog model expects `products.category`
  - store/admin expect `products.category_id` and `brand_id`
  - one query family can fail depending on actual DB shape

### 6.6 Service/banner admin assumes schema not defined in repo

- Files:
  - `src/controllers/admin.controller.ts`
  - `schema.sql`
- Impact:
  - admin uses `services.display_order`
  - admin uses `banners` table heavily
  - neither is defined in repo schema

### 6.7 Technician “active jobs” response includes completed jobs

- Files:
  - `src/services/technician.service.ts`
  - `src/models/technician.model.ts`
- Impact:
  - comment says offline technicians only see active jobs
  - query also includes `completed`

## 7. Safe / Stable Areas

- `npm run build` succeeds
- Middleware-based role enforcement is consistent
- Technician acceptance flow includes row locking and race checks
- Error middleware avoids raw stack leakage in production mode
- Booking cancel flow has a guarded status update and idempotent wallet refund keys

## 8. Launch Readiness Assessment

### Authentication & Authorization

- Status: Mostly implemented, not fully launch-safe
- Working:
  - access JWT auth
  - role middleware
  - signup/login/password reset
  - session-backed refresh
- Risks:
  - refresh flow not JWT-verified
  - auth payload shape inconsistent

### Database Consistency

- Status: Not launch-ready
- Working:
  - some runtime table bootstrapping exists
  - some migrations patch older DBs
- Risks:
  - base schema is incomplete
  - multiple core tables are missing from repo bootstrap
  - several code paths depend on optional/manual migrations

### Bookings System

- Status: Partially ready
- Working:
  - creation
  - listing/detail
  - cancellation
  - technician assignment/update flow
- Risks:
  - booking create can fail on missing payment columns
  - booking payment path and COD path are inconsistent

### Technician System

- Status: Mostly implemented
- Working:
  - online/offline
  - location update
  - radius filtering
  - job accept/reject/update
- Risks:
  - admin can bypass operational constraints
  - some response semantics are inconsistent

### Orders / Checkout

- Status: Not ready
- Working:
  - checkout path exists
  - wallet path exists
  - order list/detail exists
- Risks:
  - broken status lifecycle
  - payment status not synchronized
  - no stock enforcement
  - referral/commission path depends on missing tables

### Error Handling

- Status: Reasonable at controller level
- Working:
  - try/catch coverage is broadly good
  - structured error middleware exists
- Risks:
  - health endpoint is misleading
  - startup does not fail closed

### API Structure

- Status: Inconsistent
- Working:
  - route modules are organized
  - admin/technician/dealer domains are separated
- Risks:
  - stale docs
  - old `agent` naming remains in docs
  - pagination contract is inconsistent

## 9. Final Verdict

## NOT READY

The backend contains a meaningful amount of implementation, and several modules are structurally solid. However, it is not launch-ready because the current codebase has real deployment blockers:

- incomplete schema/bootstrap
- booking creation schema mismatch
- broken order lifecycle
- incorrect order payment-state synchronization
- unreliable webhook verification path
- false-positive health/startup behavior

These are runtime-impacting issues, not cosmetic ones.

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
| POST | `/orders/checkout` | Checkout and place order |

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

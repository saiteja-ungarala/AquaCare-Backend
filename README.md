# AquaCare Backend

Express.js + TypeScript backend for AquaCare mobile application.

## Setup

1.  **Install Dependencies**
    ```bash
    npm install
    ```

2.  **Environment Variables**
    Copy `.env.example` to `.env` and update credential.
    ```bash
    cp .env.example .env
    ```

3.  **Database**
    Ensure MySQL is running and the `aquacare` database exists with the required schema (refer to `Below is a customer-only v1 schema.txt`).

4.  **Run Development Server**
    ```bash
    npm run dev
    ```

## API Structure

Base URL: `http://localhost:3000/api`

### Auth
- `POST /auth/signup` - Create customer account
- `POST /auth/login` - Login
- `POST /auth/refresh` - Refresh access token

### Catalog
- `GET /services` - List services
- `GET /products` - List products

### Cart
- `GET /cart` - View cart
- `POST /cart/items` - Add item
- `PATCH /cart/items/:id` - Update item

### Store
- `GET /store/categories` - Active product categories (`id`, `name`, `slug`, `icon_key`, `sort_order`)
- `GET /store/categories/:categoryId/brands` - Active brands that have active products in the category
- `GET /store/products` - Active products filtered by `category_id` (and optional `brand_id`, `search`)
- `GET /store/products/:id` - Active product detail with brand/category info

## Product Image Storage

- `products.image_url` is stored as a file name (example: `ionora_purifier_basic.jpg`).
- Place product images in `uploads/products/<filename>`.
- API responses include `image_url_full`, resolved as:
  `BASE_SERVER_URL/uploads/products/<filename>` (or request host fallback when `BASE_SERVER_URL` is not set).

### Orders
- `POST /orders/checkout` - Checkout cart
- `GET /orders` - List orders

## cURL Examples

**Signup**
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"full_name": "John Doe", "email": "john@example.com", "password": "password123", "role": "customer"}'
```

**Login**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "john@example.com", "password": "password123"}'
```

**Get Services**
```bash
curl http://localhost:3000/api/services
```

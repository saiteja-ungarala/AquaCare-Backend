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

-- Migration 008: Add placed_by_role to orders
-- Distinguishes orders placed by customers vs technicians

ALTER TABLE orders
    ADD COLUMN placed_by_role VARCHAR(20) NOT NULL DEFAULT 'customer'
        AFTER user_id;

-- Back-fill existing rows (all pre-existing orders were customer orders)
UPDATE orders SET placed_by_role = 'customer' WHERE placed_by_role IS NULL OR placed_by_role = '';

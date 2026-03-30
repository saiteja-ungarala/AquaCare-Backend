-- Migration 011: Add COD payment fields to bookings
-- Adds payment_method and payment_status columns.
-- Fixes existing bookings stuck in 'pending' status (no payment gateway was ever integrated).

ALTER TABLE bookings
    ADD COLUMN IF NOT EXISTS payment_method ENUM('cod', 'online') NOT NULL DEFAULT 'cod',
    ADD COLUMN IF NOT EXISTS payment_status ENUM('pending', 'completed') NOT NULL DEFAULT 'pending';

-- Promote any bookings stuck in 'pending' (awaiting payment that never existed) to 'confirmed'
-- so technicians can see and accept them.
UPDATE bookings
SET status = 'confirmed'
WHERE status = 'pending'
  AND technician_id IS NULL;

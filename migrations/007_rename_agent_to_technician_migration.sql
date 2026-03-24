-- Migration 007: Rename agent business-domain schema to technician
-- Recommended rollout order:
-- 1. Run this migration.
-- 2. Deploy the backend code that reads/writes technician_* names.
-- 3. Keep /agent API routes temporarily for frontend compatibility.

DELIMITER $$

DROP PROCEDURE IF EXISTS rename_table_if_exists $$
CREATE PROCEDURE rename_table_if_exists(IN old_name VARCHAR(64), IN new_name VARCHAR(64))
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = DATABASE()
          AND table_name = old_name
    ) AND NOT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = DATABASE()
          AND table_name = new_name
    ) THEN
        SET @sql = CONCAT('RENAME TABLE `', old_name, '` TO `', new_name, '`');
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END $$

DROP PROCEDURE IF EXISTS rename_column_if_exists $$
CREATE PROCEDURE rename_column_if_exists(IN table_name_in VARCHAR(64), IN old_name VARCHAR(64), IN new_name VARCHAR(64))
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = DATABASE()
          AND table_name = table_name_in
    ) AND EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = DATABASE()
          AND table_name = table_name_in
          AND column_name = old_name
    ) AND NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = DATABASE()
          AND table_name = table_name_in
          AND column_name = new_name
    ) THEN
        SET @sql = CONCAT(
            'ALTER TABLE `', table_name_in, '` RENAME COLUMN `', old_name, '` TO `', new_name, '`'
        );
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END $$

DROP PROCEDURE IF EXISTS add_index_if_missing $$
CREATE PROCEDURE add_index_if_missing(IN table_name_in VARCHAR(64), IN index_name_in VARCHAR(64), IN column_name_in VARCHAR(64))
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = DATABASE()
          AND table_name = table_name_in
          AND column_name = column_name_in
    ) AND NOT EXISTS (
        SELECT 1
        FROM information_schema.statistics
        WHERE table_schema = DATABASE()
          AND table_name = table_name_in
          AND column_name = column_name_in
    ) THEN
        SET @sql = CONCAT(
            'ALTER TABLE `', table_name_in, '` ADD INDEX `', index_name_in, '` (`', column_name_in, '`)'
        );
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END $$

DROP PROCEDURE IF EXISTS add_fk_if_missing $$
CREATE PROCEDURE add_fk_if_missing(
    IN table_name_in VARCHAR(64),
    IN fk_name_in VARCHAR(64),
    IN column_name_in VARCHAR(64),
    IN ref_table_name_in VARCHAR(64),
    IN ref_column_name_in VARCHAR(64),
    IN on_delete_rule_in VARCHAR(32)
)
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = DATABASE()
          AND table_name = table_name_in
          AND column_name = column_name_in
    ) AND EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = DATABASE()
          AND table_name = ref_table_name_in
          AND column_name = ref_column_name_in
    ) AND NOT EXISTS (
        SELECT 1
        FROM information_schema.key_column_usage
        WHERE table_schema = DATABASE()
          AND table_name = table_name_in
          AND column_name = column_name_in
          AND referenced_table_name IS NOT NULL
    ) THEN
        SET @sql = CONCAT(
            'ALTER TABLE `', table_name_in, '` ',
            'ADD CONSTRAINT `', fk_name_in, '` ',
            'FOREIGN KEY (`', column_name_in, '`) ',
            'REFERENCES `', ref_table_name_in, '`(`', ref_column_name_in, '`) ',
            'ON DELETE ', on_delete_rule_in, ' ON UPDATE CASCADE'
        );
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END $$

DROP PROCEDURE IF EXISTS expand_users_role_enum_if_needed $$
CREATE PROCEDURE expand_users_role_enum_if_needed()
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = DATABASE()
          AND table_name = 'users'
          AND column_name = 'role'
          AND column_type LIKE 'enum(%'
    ) THEN
        ALTER TABLE users
            MODIFY role ENUM('customer', 'agent', 'technician', 'dealer', 'admin') NOT NULL DEFAULT 'customer';
    END IF;
END $$

DROP PROCEDURE IF EXISTS finalize_users_role_enum_if_needed $$
CREATE PROCEDURE finalize_users_role_enum_if_needed()
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = DATABASE()
          AND table_name = 'users'
          AND column_name = 'role'
          AND column_type LIKE 'enum(%'
    ) THEN
        ALTER TABLE users
            MODIFY role ENUM('customer', 'technician', 'dealer', 'admin') NOT NULL DEFAULT 'customer';
    END IF;
END $$

CALL expand_users_role_enum_if_needed();

UPDATE users
SET role = 'technician'
WHERE role = 'agent';

CALL finalize_users_role_enum_if_needed();

CALL rename_table_if_exists('agent_profiles', 'technician_profiles');
CALL rename_table_if_exists('agent_kyc_documents', 'technician_kyc_documents');
CALL rename_table_if_exists('agent_commissions', 'technician_commissions');
CALL rename_table_if_exists('agent_commission_bonuses', 'technician_commission_bonuses');

CALL rename_column_if_exists('bookings', 'agent_id', 'technician_id');
CALL rename_column_if_exists('booking_offers', 'agent_id', 'technician_id');
CALL rename_column_if_exists('booking_updates', 'agent_id', 'technician_id');
CALL rename_column_if_exists('orders', 'referred_by_agent_id', 'referred_by_technician_id');
CALL rename_column_if_exists('technician_kyc_documents', 'agent_id', 'technician_id');
CALL rename_column_if_exists('technician_commissions', 'agent_id', 'technician_id');
CALL rename_column_if_exists('technician_commission_bonuses', 'agent_id', 'technician_id');

CALL add_index_if_missing('bookings', 'idx_bookings_technician_id', 'technician_id');
CALL add_index_if_missing('booking_offers', 'idx_booking_offers_technician_id', 'technician_id');
CALL add_index_if_missing('booking_updates', 'idx_booking_updates_technician_id', 'technician_id');
CALL add_index_if_missing('orders', 'idx_orders_referred_by_technician_id', 'referred_by_technician_id');
CALL add_index_if_missing('technician_kyc_documents', 'idx_technician_kyc_technician_id', 'technician_id');
CALL add_index_if_missing('technician_kyc_documents', 'idx_technician_kyc_status', 'status');
CALL add_index_if_missing('technician_commissions', 'idx_technician_commissions_technician_id', 'technician_id');
CALL add_index_if_missing('technician_commission_bonuses', 'idx_technician_commission_bonuses_technician_id', 'technician_id');

CALL add_fk_if_missing('technician_profiles', 'fk_technician_profiles_user', 'user_id', 'users', 'id', 'CASCADE');
CALL add_fk_if_missing('technician_kyc_documents', 'fk_technician_kyc_technician', 'technician_id', 'users', 'id', 'CASCADE');
CALL add_fk_if_missing('technician_kyc_documents', 'fk_technician_kyc_reviewer', 'reviewed_by', 'users', 'id', 'SET NULL');
CALL add_fk_if_missing('orders', 'fk_orders_referred_by_technician', 'referred_by_technician_id', 'users', 'id', 'SET NULL');

DROP PROCEDURE IF EXISTS rename_table_if_exists $$
DROP PROCEDURE IF EXISTS rename_column_if_exists $$
DROP PROCEDURE IF EXISTS add_index_if_missing $$
DROP PROCEDURE IF EXISTS add_fk_if_missing $$
DROP PROCEDURE IF EXISTS expand_users_role_enum_if_needed $$
DROP PROCEDURE IF EXISTS finalize_users_role_enum_if_needed $$

DELIMITER ;

import { RowDataPacket } from 'mysql2';
import pool from './db';

const tableExists = async (tableName: string): Promise<boolean> => {
    const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT 1
         FROM information_schema.tables
         WHERE table_schema = DATABASE()
           AND table_name = ?
         LIMIT 1`,
        [tableName]
    );

    return rows.length > 0;
};

const columnExists = async (tableName: string, columnName: string): Promise<boolean> => {
    const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT 1
         FROM information_schema.columns
         WHERE table_schema = DATABASE()
           AND table_name = ?
           AND column_name = ?
         LIMIT 1`,
        [tableName, columnName]
    );

    return rows.length > 0;
};

const indexExists = async (tableName: string, indexName: string): Promise<boolean> => {
    const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT 1
         FROM information_schema.statistics
         WHERE table_schema = DATABASE()
           AND table_name = ?
           AND index_name = ?
         LIMIT 1`,
        [tableName, indexName]
    );

    return rows.length > 0;
};

const ensureColumn = async (tableName: string, columnName: string, definition: string): Promise<void> => {
    if (!(await tableExists(tableName))) return;
    if (await columnExists(tableName, columnName)) return;

    await pool.query(`ALTER TABLE \`${tableName}\` ADD COLUMN \`${columnName}\` ${definition}`);
};

const ensureIndex = async (tableName: string, indexName: string, definition: string): Promise<void> => {
    if (!(await tableExists(tableName))) return;
    if (await indexExists(tableName, indexName)) return;

    await pool.query(`ALTER TABLE \`${tableName}\` ADD INDEX \`${indexName}\` ${definition}`);
};

export const ensureLaunchSchema = async (): Promise<void> => {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS technician_profiles (
            user_id INT PRIMARY KEY,
            verification_status ENUM('unverified','pending','approved','rejected','suspended') NOT NULL DEFAULT 'unverified',
            is_online TINYINT(1) NOT NULL DEFAULT 0,
            service_radius_km DECIMAL(6,2) NOT NULL DEFAULT 10,
            base_lat DECIMAL(10,7) NULL,
            base_lng DECIMAL(10,7) NULL,
            last_online_at DATETIME NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            CONSTRAINT fk_technician_profiles_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    `);

    await ensureColumn('technician_profiles', 'service_radius_km', 'DECIMAL(6,2) NOT NULL DEFAULT 10 AFTER is_online');
    await ensureColumn('technician_profiles', 'base_lat', 'DECIMAL(10,7) NULL AFTER service_radius_km');
    await ensureColumn('technician_profiles', 'base_lng', 'DECIMAL(10,7) NULL AFTER base_lat');
    await ensureColumn('technician_profiles', 'last_online_at', 'DATETIME NULL AFTER base_lng');

    await pool.query(`
        ALTER TABLE technician_profiles
        MODIFY verification_status
        ENUM('unverified','pending','approved','rejected','suspended') NOT NULL DEFAULT 'unverified'
    `);

    await pool.query(`
        CREATE TABLE IF NOT EXISTS technician_kyc_documents (
            id INT AUTO_INCREMENT PRIMARY KEY,
            technician_id INT NOT NULL,
            doc_type VARCHAR(50) NOT NULL,
            file_url VARCHAR(500) NOT NULL,
            status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
            review_notes TEXT NULL,
            reviewed_by INT NULL,
            reviewed_at DATETIME NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_technician_kyc_technician_id (technician_id),
            INDEX idx_technician_kyc_status (status),
            CONSTRAINT fk_technician_kyc_technician FOREIGN KEY (technician_id) REFERENCES users(id) ON DELETE CASCADE,
            CONSTRAINT fk_technician_kyc_reviewer FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
        )
    `);

    await ensureColumn('technician_kyc_documents', 'review_notes', 'TEXT NULL AFTER status');
    await ensureColumn('technician_kyc_documents', 'reviewed_by', 'INT NULL AFTER review_notes');
    await ensureColumn('technician_kyc_documents', 'reviewed_at', 'DATETIME NULL AFTER reviewed_by');

    await ensureColumn('bookings', 'technician_id', 'INT NULL AFTER service_id');
    await ensureColumn('bookings', 'assigned_at', 'DATETIME NULL AFTER notes');
    await ensureColumn('bookings', 'completed_at', 'DATETIME NULL AFTER assigned_at');
    await ensureColumn('bookings', 'updated_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at');
    await ensureIndex('bookings', 'idx_bookings_technician_id', '(`technician_id`)');

    await pool.query(`
        CREATE TABLE IF NOT EXISTS booking_offers (
            id INT AUTO_INCREMENT PRIMARY KEY,
            booking_id INT NOT NULL,
            technician_id INT NOT NULL,
            status ENUM('pending','accepted','rejected') NOT NULL DEFAULT 'pending',
            offered_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            responded_at DATETIME NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY uq_booking_offers_booking_technician (booking_id, technician_id),
            INDEX idx_booking_offers_technician_id (technician_id),
            INDEX idx_booking_offers_status (status),
            CONSTRAINT fk_booking_offers_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
            CONSTRAINT fk_booking_offers_technician FOREIGN KEY (technician_id) REFERENCES users(id) ON DELETE CASCADE
        )
    `);

    await ensureColumn('booking_offers', 'offered_at', 'DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP AFTER status');
    await ensureColumn('booking_offers', 'responded_at', 'DATETIME NULL AFTER offered_at');

    await pool.query(`
        CREATE TABLE IF NOT EXISTS booking_updates (
            id INT AUTO_INCREMENT PRIMARY KEY,
            booking_id INT NOT NULL,
            technician_id INT NOT NULL,
            update_type ENUM('arrived','diagnosed','in_progress','completed','photo','note') NOT NULL,
            note TEXT NULL,
            media_url VARCHAR(500) NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_booking_updates_booking_id (booking_id),
            INDEX idx_booking_updates_technician_id (technician_id),
            CONSTRAINT fk_booking_updates_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
            CONSTRAINT fk_booking_updates_technician FOREIGN KEY (technician_id) REFERENCES users(id) ON DELETE CASCADE
        )
    `);

    await ensureColumn('booking_updates', 'note', 'TEXT NULL AFTER update_type');
    await ensureColumn('booking_updates', 'media_url', 'VARCHAR(500) NULL AFTER note');
};

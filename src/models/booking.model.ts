import pool from '../config/db';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { BOOKING_STATUS } from '../config/constants';

export interface Booking {
    id: number;
    user_id: number;
    service_id: number;
    address_id?: number;
    scheduled_date: string;
    scheduled_time: string;
    status: string;
    price: number;
    notes?: string;
    created_at: Date;
}

export const BookingModel = {
    async create(data: Partial<Booking>): Promise<number> {
        const [result] = await pool.query<ResultSetHeader>(
            `INSERT INTO bookings (user_id, service_id, address_id, scheduled_date, scheduled_time, status, price, notes) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                data.user_id, data.service_id, data.address_id || null, data.scheduled_date, data.scheduled_time,
                data.status || BOOKING_STATUS.PENDING, data.price, data.notes || null
            ]
        );
        return result.insertId;
    },

    async findByUser(userId: number, limit = 20, offset = 0): Promise<{ bookings: Booking[]; total: number }> {
        const [countRows] = await pool.query<RowDataPacket[]>('SELECT COUNT(*) as total FROM bookings WHERE user_id = ?', [userId]);
        const total = countRows[0].total;

        const query = `
      SELECT b.*, s.name as service_name, s.image_url as service_image 
      FROM bookings b
      JOIN services s ON b.service_id = s.id
      WHERE b.user_id = ? 
      ORDER BY b.created_at DESC 
      LIMIT ? OFFSET ?
    `;
        const [rows] = await pool.query<RowDataPacket[]>(query, [userId, limit, offset]);
        return { bookings: rows as Booking[], total };
    },

    async findById(id: number): Promise<Booking | null> {
        const [rows] = await pool.query<RowDataPacket[]>(
            `SELECT b.*, s.name as service_name, s.duration_minutes 
         FROM bookings b
         JOIN services s ON b.service_id = s.id
         WHERE b.id = ?`,
            [id]
        );
        return (rows[0] as Booking) || null;
    },

    async updateStatus(id: number, status: string): Promise<void> {
        await pool.query('UPDATE bookings SET status = ? WHERE id = ?', [status, id]);
    }
};

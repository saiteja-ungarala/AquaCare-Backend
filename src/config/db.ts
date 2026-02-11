import mysql, { Pool } from 'mysql2/promise';
import { env } from './env';

const pool: Pool = mysql.createPool({
    host: env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

pool.getConnection()
    .then((connection) => {
        console.log('Database connected successfully');
        connection.release();
    })
    .catch((err) => {
        console.error('Database connection failed:', err.message);
    });

export default pool;

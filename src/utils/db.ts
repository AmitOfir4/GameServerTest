import pool from '../config/db-config';

export const query = async (text: string, params?: any[]) => {
    const client = await pool.connect();
    try {
        const result = await client.query(text, params);
        return result.rows;
    } finally {
        client.release();
    }
};
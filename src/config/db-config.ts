import { Pool } from 'pg';

const pool = new Pool({
    user: 'postgres', // Your PostgreSQL username
    host: 'localhost', // Database host
    database: 'localPostgres', // Your database name
    password: '', // Your PostgreSQL password (leave empty if none)
    port: 5432, // Default PostgreSQL port
});

export default pool;
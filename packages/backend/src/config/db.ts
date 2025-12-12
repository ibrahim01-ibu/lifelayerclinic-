import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

// Load env from root if not already loaded (for standalone script usage)
dotenv.config({ path: path.join(__dirname, '../../../../.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

export const query = (text: string, params?: any[]) => pool.query(text, params);
export const getClient = () => pool.connect();

export default pool;

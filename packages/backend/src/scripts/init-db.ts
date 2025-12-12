import fs from 'fs';
import path from 'path';
import pool from '../config/db';

async function initDb() {
    const client = await pool.connect();
    try {
        console.log('Initializing database...');

        const schemaPath = path.join(__dirname, '../../db/init.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');

        console.log('Running init.sql...');
        await client.query(schemaSql);

        console.log('Database initialized successfully!');
    } catch (err) {
        console.error('Error initializing database:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

initDb();

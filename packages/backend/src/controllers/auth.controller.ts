import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs'; // Need to add this dependency, or use standard crypto
// We will use bcryptjs for simplicity in non-Supabase Auth flow, assuming self-managed auth table for this demo as per SQL.
// Spec said "Supabase Auth (JWT)", which implies Supabase manages users. 
// However, the SQL schema provided includes a `users` table with `password_hash`.
// I will implement "Self-Hosted" auth using that table to be strictly compliant with the SQL schema provided.

import jwt from 'jsonwebtoken';
import pool from '../config/db';

const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-dev-key-change-in-prod';

export const registerClinic = async (req: Request, res: Response, next: NextFunction) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const {
            clinicName, licenseNumber, email, password, phone,
            address, city, state, postalCode, fullName
        } = req.body;

        // 1. Create Clinic
        const clinicRes = await client.query(
            `INSERT INTO clinics (name, license_number, email, phone, address, city, state, postal_code)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
            [clinicName, licenseNumber, email, phone, address, city, state, postalCode]
        );
        const clinicId = clinicRes.rows[0].id;

        // 2. Create Admin User
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
        const userRes = await client.query(
            `INSERT INTO users (clinic_id, email, password_hash, full_name, role, phone)
       VALUES ($1, $2, $3, $4, 'admin', $5)
       RETURNING id, email, full_name, role`,
            [clinicId, email, hashedPassword, fullName, phone]
        );
        const user = userRes.rows[0];

        // 3. Create Default Settings
        await client.query(
            `INSERT INTO clinic_settings (clinic_id) VALUES ($1)`,
            [clinicId]
        );

        await client.query('COMMIT');

        // Generate Token
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role, clinic_id: clinicId },
            JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.status(201).json({
            status: 'success',
            data: {
                token,
                user,
                clinicId
            }
        });

    } catch (err) {
        await client.query('ROLLBACK');
        next(err);
    } finally {
        client.release();
    }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, password } = req.body;

        const result = await pool.query(
            `SELECT * FROM users WHERE email = $1 AND is_active = true`,
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ status: 'error', message: 'Invalid credentials' });
        }

        const user = result.rows[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            return res.status(401).json({ status: 'error', message: 'Invalid credentials' });
        }

        // Update last login
        await pool.query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role, clinic_id: user.clinic_id },
            JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.json({
            status: 'success',
            data: {
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    fullName: user.full_name,
                    role: user.role,
                    clinicId: user.clinic_id
                }
            }
        });

    } catch (err) {
        next(err);
    }
};

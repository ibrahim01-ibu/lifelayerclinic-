import { Request, Response, NextFunction } from 'express';
import pool from '../config/db';
import bcrypt from 'bcryptjs';

export const getClinicSettings = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const clinicId = req.user?.clinic_id;
        const result = await pool.query(
            `SELECT * FROM clinic_settings WHERE clinic_id = $1`,
            [clinicId]
        );

        if (result.rows.length === 0) {
            // Should not happen if registered correctly, but handle anyway
            return res.status(404).json({ status: 'error', message: 'Settings not found' });
        }

        res.json({ status: 'success', data: result.rows[0] });
    } catch (err) {
        next(err);
    }
};

export const updateClinicSettings = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const clinicId = req.user?.clinic_id;
        const {
            consultationFeeDefault, followUpFee, appointmentReminderEnabled,
            clinicHoursStart, clinicHoursEnd
        } = req.body;

        const result = await pool.query(
            `UPDATE clinic_settings 
       SET 
         consultation_fee_default = COALESCE($1, consultation_fee_default),
         follow_up_fee = COALESCE($2, follow_up_fee),
         appointment_reminder_enabled = COALESCE($3, appointment_reminder_enabled),
         clinic_hours_start = COALESCE($4, clinic_hours_start),
         clinic_hours_end = COALESCE($5, clinic_hours_end),
         updated_at = NOW()
       WHERE clinic_id = $6
       RETURNING *`,
            [consultationFeeDefault, followUpFee, appointmentReminderEnabled, clinicHoursStart, clinicHoursEnd, clinicId]
        );

        res.json({ status: 'success', data: result.rows[0] });
    } catch (err) {
        next(err);
    }
};

export const getUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const clinicId = req.user?.clinic_id;
        const result = await pool.query(
            `SELECT id, email, full_name, role, phone, is_active FROM users WHERE clinic_id = $1`,
            [clinicId]
        );
        res.json({ status: 'success', data: result.rows });
    } catch (err) {
        next(err);
    }
};

export const addUser = async (req: Request, res: Response, next: NextFunction) => {
    const client = await pool.connect();
    try {
        const clinicId = req.user?.clinic_id;
        const { email, password, fullName, role, phone, registrationNumber, specializations } = req.body;

        await client.query('BEGIN');

        const hashedPassword = await bcrypt.hash(password, 10);
        const userRes = await client.query(
            `INSERT INTO users (clinic_id, email, password_hash, full_name, role, phone)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
            [clinicId, email, hashedPassword, fullName, role, phone]
        );
        const userId = userRes.rows[0].id;

        // If doctor, add to doctors table
        if (role === 'doctor') {
            await client.query(
                `INSERT INTO doctors (clinic_id, user_id, registration_number, specializations)
         VALUES ($1, $2, $3, $4)`,
                [clinicId, userId, registrationNumber || 'PENDING', specializations || []]
            );
        }

        await client.query('COMMIT');
        res.status(201).json({ status: 'success', message: 'User created successfully', data: { userId } });
    } catch (err) {
        await client.query('ROLLBACK');
        next(err);
    } finally {
        client.release();
    }
};

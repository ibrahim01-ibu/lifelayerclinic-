import { Request, Response, NextFunction } from 'express';
import pool from '../config/db';

export const getAppointments = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const clinicId = req.user?.clinic_id;
        const { date, doctorId, status } = req.query;

        let query = `
      SELECT a.*, p.full_name as patient_name, p.patient_mrn, d.user_id as doctor_user_id
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      JOIN doctors d ON a.doctor_id = d.id
      WHERE a.clinic_id = $1
    `;
        const params: any[] = [clinicId];

        if (date) {
            query += ` AND a.appointment_date = $${params.length + 1}`;
            params.push(date);
        }
        if (doctorId) {
            query += ` AND a.doctor_id = $${params.length + 1}`;
            params.push(doctorId);
        }
        if (status) {
            query += ` AND a.status = $${params.length + 1}`;
            params.push(status);
        }

        query += ` ORDER BY a.appointment_datetime ASC`;

        const result = await pool.query(query, params);
        res.json({ status: 'success', data: result.rows });
    } catch (err) {
        next(err);
    }
};

export const createAppointment = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const clinicId = req.user?.clinic_id;
        const { patientId, doctorId, date, time, type, reason } = req.body;

        const datetime = `${date}T${time}`; // ISO format assumption or simple concatenation

        const result = await pool.query(
            `INSERT INTO appointments (
        clinic_id, patient_id, doctor_id, appointment_date, appointment_time, appointment_datetime,
        appointment_type, reason_for_visit, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'scheduled')
      RETURNING *`,
            [clinicId, patientId, doctorId, date, time, datetime, type, reason]
        );

        res.status(201).json({ status: 'success', data: result.rows[0] });
    } catch (err) {
        next(err);
    }
};

export const checkInPatient = async (req: Request, res: Response, next: NextFunction) => {
    const client = await pool.connect();
    try {
        const clinicId = req.user?.clinic_id;
        const { id } = req.params; // Appointment ID

        await client.query('BEGIN');

        // 1. Update appointment status
        const apptRes = await client.query(
            `UPDATE appointments 
       SET status = 'checked_in', checked_in_at = NOW(), updated_at = NOW()
       WHERE id = $1 AND clinic_id = $2
       RETURNING *`,
            [id, clinicId]
        );

        if (apptRes.rows.length === 0) {
            throw new Error('Appointment not found');
        }
        const appointment = apptRes.rows[0];

        // 2. Add to Queue
        // Get current max position
        const queueRes = await client.query(
            `SELECT MAX(queue_position) as max_pos FROM patient_queue 
       WHERE clinic_id = $1 AND doctor_id = $2 AND status = 'waiting' AND created_at::date = CURRENT_DATE`,
            [clinicId, appointment.doctor_id]
        );
        const nextPos = (queueRes.rows[0].max_pos || 0) + 1;

        await client.query(
            `INSERT INTO patient_queue (
        clinic_id, doctor_id, patient_id, appointment_id, queue_position, check_in_time, status
      ) VALUES ($1, $2, $3, $4, $5, NOW(), 'waiting')`,
            [clinicId, appointment.doctor_id, appointment.patient_id, appointment.id, nextPos]
        );

        await client.query('COMMIT');
        res.json({ status: 'success', message: 'Checked in successfully', data: appointment });

    } catch (err) {
        await client.query('ROLLBACK');
        next(err);
    } finally {
        client.release();
    }
};

export const getQueueStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const clinicId = req.user?.clinic_id;
        const { doctorId } = req.query;

        let query = `
      SELECT q.*, p.full_name as patient_name, p.patient_mrn, a.appointment_time
      FROM patient_queue q
      JOIN patients p ON q.patient_id = p.id
      LEFT JOIN appointments a ON q.appointment_id = a.id
      WHERE q.clinic_id = $1 AND q.created_at::date = CURRENT_DATE
    `;
        const params: any[] = [clinicId];

        if (doctorId) {
            query += ` AND q.doctor_id = $2`;
            params.push(doctorId);
        }

        query += ` ORDER BY q.status DESC, q.queue_position ASC`; // waiting first? actually status sort might need custom logic or just filter

        const result = await pool.query(query, params);

        // Group by status if needed, but returning list is fine for frontend to filter
        res.json({ status: 'success', data: result.rows });
    } catch (err) {
        next(err);
    }
};

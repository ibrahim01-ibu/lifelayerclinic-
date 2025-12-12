import { Request, Response, NextFunction } from 'express';
import pool from '../config/db';

export const getPatients = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const clinicId = req.user?.clinic_id;
        const { search, limit = 20, offset = 0 } = req.query;

        let query = `SELECT * FROM patients WHERE clinic_id = $1 AND is_active = true`;
        const params: any[] = [clinicId];

        if (search) {
            query += ` AND (full_name ILIKE $2 OR phone ILIKE $2 OR patient_mrn ILIKE $2)`;
            params.push(`%${search}%`);
        }

        query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(limit, offset);

        const result = await pool.query(query, params);

        // Get total count for pagination
        const countQuery = `SELECT COUNT(*) FROM patients WHERE clinic_id = $1 AND is_active = true`;
        const countRes = await pool.query(countQuery, [clinicId]);

        res.json({
            status: 'success',
            data: result.rows,
            meta: {
                total: parseInt(countRes.rows[0].count),
                limit: +limit,
                offset: +offset
            }
        });

    } catch (err) {
        next(err);
    }
};

export const createPatient = async (req: Request, res: Response, next: NextFunction) => {
    const client = await pool.connect();
    try {
        const clinicId = req.user?.clinic_id;
        const {
            fullName, dob, gender, bloodGroup, phone, email,
            address, city, state, postalCode, emergencyContactName, emergencyContactPhone
        } = req.body;

        await client.query('BEGIN');

        // Generate MRN (Simple auto-increment logic or random for now, ideally strictly sequential per clinic)
        // UUID is default ID, MRN is display ID.
        const mrnRes = await client.query(`SELECT COUNT(*) FROM patients WHERE clinic_id = $1`, [clinicId]);
        const mrnSeq = parseInt(mrnRes.rows[0].count) + 1;
        const mrn = `P${Date.now().toString().slice(-4)}${mrnSeq.toString().padStart(4, '0')}`;

        const result = await client.query(
            `INSERT INTO patients (
        clinic_id, patient_mrn, full_name, date_of_birth, gender, blood_group, 
        phone, email, address, city, state, postal_code,
        emergency_contact_name, emergency_contact_phone
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *`,
            [clinicId, mrn, fullName, dob, gender, bloodGroup, phone, email, address, city, state, postalCode, emergencyContactName, emergencyContactPhone]
        );

        const patient = result.rows[0];

        // Auto-generate LifeCard logic placeholder
        // We would typically call a service to generate the LifeCard here
        await client.query(
            `INSERT INTO lifecards (clinic_id, patient_id, card_number, issue_date)
       VALUES ($1, $2, $3, NOW())`,
            [clinicId, patient.id, `LC-${mrn}`]
        );

        await client.query('COMMIT');

        res.status(201).json({ status: 'success', data: patient });

    } catch (err) {
        await client.query('ROLLBACK');
        next(err);
    } finally {
        client.release();
    }
};

export const getPatientById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const clinicId = req.user?.clinic_id;
        const { id } = req.params;

        const patientRes = await pool.query(
            `SELECT * FROM patients WHERE id = $1 AND clinic_id = $2`,
            [id, clinicId]
        );

        if (patientRes.rows.length === 0) {
            return res.status(404).json({ status: 'error', message: 'Patient not found' });
        }

        const conditionsRes = await pool.query(`SELECT * FROM patient_conditions WHERE patient_id = $1`, [id]);
        const allergiesRes = await pool.query(`SELECT * FROM patient_allergies WHERE patient_id = $1`, [id]);

        res.json({
            status: 'success',
            data: {
                ...patientRes.rows[0],
                conditions: conditionsRes.rows,
                allergies: allergiesRes.rows
            }
        });

    } catch (err) {
        next(err);
    }
};

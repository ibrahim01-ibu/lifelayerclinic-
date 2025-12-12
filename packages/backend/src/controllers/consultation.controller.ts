import { Request, Response, NextFunction } from 'express';
import pool from '../config/db';
import { z } from 'zod';

// Simple PDF generation stub (in real app would use PDFKit/Puppeteer)
// import PDFDocument from 'pdfkit';

export const startConsultation = async (req: Request, res: Response, next: NextFunction) => {
    const client = await pool.connect();
    try {
        const clinicId = req.user?.clinic_id;
        const { appointmentId } = req.body;

        await client.query('BEGIN');

        // 1. Verify Appointment matches Date/Doctor? (Optional, checks in FE usually)

        // 2. Create Consultation Record
        const consultRes = await client.query(
            `INSERT INTO consultations (appointment_id, started_at)
       VALUES ($1, NOW())
       RETURNING *`,
            [appointmentId]
        );

        // 3. Update Queue Status
        await client.query(
            `UPDATE patient_queue SET status = 'consulting' 
       WHERE appointment_id = $1 AND clinic_id = $2`,
            [appointmentId, clinicId]
        );

        await client.query('COMMIT');
        res.status(201).json({ status: 'success', data: consultRes.rows[0] });

    } catch (err) {
        await client.query('ROLLBACK');
        next(err);
    } finally {
        client.release();
    }
};

export const updateConsultation = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const {
            chiefComplaint, hpi, pmh, physicalExam, assessment, plan, vitals, notes
        } = req.body;

        const result = await pool.query(
            `UPDATE consultations 
       SET 
         chief_complaint = COALESCE($1, chief_complaint),
         history_of_present_illness = COALESCE($2, history_of_present_illness),
         past_medical_history = COALESCE($3, past_medical_history),
         physical_examination = COALESCE($4, physical_examination),
         assessment = COALESCE($5, assessment),
         plan = COALESCE($6, plan),
         vitals = COALESCE($7, vitals),
         doctor_notes = COALESCE($8, doctor_notes),
         updated_at = NOW()
       WHERE id = $9
       RETURNING *`,
            [chiefComplaint, hpi, pmh, physicalExam, assessment, plan, vitals, notes, id]
        );

        res.json({ status: 'success', data: result.rows[0] });
    } catch (err) {
        next(err);
    }
};

export const createPrescription = async (req: Request, res: Response, next: NextFunction) => {
    const client = await pool.connect();
    try {
        const clinicId = req.user?.clinic_id;
        const userId = req.user?.id;
        const { consultationId, patientId, doctorId, medicines, instructions } = req.body;

        await client.query('BEGIN');

        // Get Doctor ID from User ID if not provided (safety)
        const docRes = await client.query(`SELECT id FROM doctors WHERE user_id = $1`, [userId]);
        const actualDoctorId = docRes.rows[0]?.id || doctorId;

        // Generate Rx Number
        const rxSeqRes = await client.query(`SELECT COUNT(*) FROM prescriptions WHERE clinic_id = $1`, [clinicId]);
        const rxNumber = `RX-${Date.now().toString().slice(-6)}-${parseInt(rxSeqRes.rows[0].count) + 1}`;

        // 1. Create Prescription Header
        const rxRes = await client.query(
            `INSERT INTO prescriptions (
        clinic_id, consultation_id, patient_id, doctor_id, prescription_date, 
        prescription_number, instructions
      ) VALUES ($1, $2, $3, $4, CURRENT_DATE, $5, $6)
      RETURNING id, prescription_number`,
            [clinicId, consultationId, patientId, actualDoctorId, rxNumber, instructions]
        );
        const rxId = rxRes.rows[0].id;

        // 2. Add Medicines
        if (medicines && Array.isArray(medicines)) {
            for (const med of medicines) {
                await client.query(
                    `INSERT INTO prescription_medicines (
            prescription_id, drug_name, strength, form, frequency, duration_days, special_instructions
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                    [rxId, med.name, med.strength, med.form, med.frequency, med.duration, med.instructions]
                );
            }
        }

        await client.query('COMMIT');
        res.status(201).json({ status: 'success', data: { id: rxId, prescriptionNumber: rxNumber } });

    } catch (err) {
        await client.query('ROLLBACK');
        next(err);
    } finally {
        client.release();
    }
};

export const getConsultationById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;

        // Get consultation details
        const result = await pool.query(`SELECT * FROM consultations WHERE id = $1`, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ status: 'error', message: 'Consultation not found' });
        }

        // Get associated prescription if active
        const rxRes = await pool.query(
            `SELECT * FROM prescriptions WHERE consultation_id = $1`,
            [id]
        );

        const data = result.rows[0];
        if (rxRes.rows.length > 0) {
            const rx = rxRes.rows[0];
            const medsRes = await pool.query(`SELECT * FROM prescription_medicines WHERE prescription_id = $1`, [rx.id]);
            data.prescription = { ...rx, medicines: medsRes.rows };
        }

        res.json({ status: 'success', data });

    } catch (err) {
        next(err);
    }
};

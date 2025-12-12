import { Request, Response, NextFunction } from 'express';
import pool from '../config/db';

export const getDashboardStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const clinicId = req.user?.clinic_id;

        // Today's stats
        const today = new Date().toISOString().split('T')[0];

        const appointmentsRes = await pool.query(
            `SELECT COUNT(*) FROM appointments WHERE clinic_id = $1 AND appointment_date = $2`,
            [clinicId, today]
        );

        const patientsRes = await pool.query(
            `SELECT COUNT(*) FROM patients WHERE clinic_id = $1 AND created_at::date = $2`,
            [clinicId, today]
        );

        const revenueRes = await pool.query(
            `SELECT SUM(net_amount) FROM invoices WHERE clinic_id = $1 AND invoice_date = $2`,
            [clinicId, today]
        );

        res.json({
            status: 'success',
            data: {
                appointmentsToday: parseInt(appointmentsRes.rows[0].count),
                newPatientsToday: parseInt(patientsRes.rows[0].count),
                revenueToday: parseFloat(revenueRes.rows[0].sum || 0)
            }
        });

    } catch (err) {
        next(err);
    }
};

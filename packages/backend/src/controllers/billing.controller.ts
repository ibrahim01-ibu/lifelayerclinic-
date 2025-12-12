import { Request, Response, NextFunction } from 'express';
import pool from '../config/db';

export const createInvoice = async (req: Request, res: Response, next: NextFunction) => {
    const client = await pool.connect();
    try {
        const clinicId = req.user?.clinic_id;
        const { patientId, appointmentId, items, discountAmount } = req.body;

        await client.query('BEGIN');

        // Generate Invoice Number
        const invSeqRes = await client.query(`SELECT COUNT(*) FROM invoices WHERE clinic_id = $1`, [clinicId]);
        const invoiceNumber = `INV-${Date.now().toString().slice(-6)}-${parseInt(invSeqRes.rows[0].count) + 1}`;

        // Calculate totals
        let totalAmount = 0;
        const invoiceItems = [];

        // Validate and sum items
        // Assuming items is array of { description, quantity, unitPrice, taxRate }
        if (items && Array.isArray(items)) {
            for (const item of items as any[]) {
                const itemTotal = item.quantity * item.unitPrice;
                totalAmount += itemTotal;
                invoiceItems.push({ ...item, total: itemTotal });
            }
        }

        const netAmount = totalAmount - (discountAmount || 0);

        // 1. Create Invoice Header
        const invRes = await client.query(
            `INSERT INTO invoices (
        clinic_id, patient_id, appointment_id, invoice_number, invoice_date, 
        total_amount, discount_amount, net_amount, status
      ) VALUES ($1, $2, $3, $4, CURRENT_DATE, $5, $6, $7, 'unpaid')
      RETURNING id, invoice_number`,
            [clinicId, patientId, appointmentId, invoiceNumber, totalAmount, discountAmount || 0, netAmount]
        );
        const invoiceId = invRes.rows[0].id;

        // 2. Create Invoice Items
        for (const item of invoiceItems) {
            await client.query(
                `INSERT INTO invoice_items (
          invoice_id, item_description, quantity, unit_price, total_price, tax_rate
        ) VALUES ($1, $2, $3, $4, $5, $6)`,
                [invoiceId, item.description, item.quantity, item.unitPrice, item.total, item.taxRate || 0]
            );
        }

        await client.query('COMMIT');
        res.status(201).json({ status: 'success', data: { id: invoiceId, invoiceNumber } });

    } catch (err) {
        await client.query('ROLLBACK');
        next(err);
    } finally {
        client.release();
    }
};

export const getInvoices = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const clinicId = req.user?.clinic_id;
        const { patientId, status } = req.query;

        let query = `SELECT * FROM invoices WHERE clinic_id = $1`;
        const params: any[] = [clinicId];

        if (patientId) {
            query += ` AND patient_id = $${params.length + 1}`;
            params.push(patientId);
        }
        if (status) {
            query += ` AND status = $${params.length + 1}`;
            params.push(status);
        }

        query += ` ORDER BY created_at DESC`;

        const result = await pool.query(query, params);
        res.json({ status: 'success', data: result.rows });
    } catch (err) {
        next(err);
    }
};

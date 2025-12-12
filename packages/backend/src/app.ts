import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { z } from 'zod';

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Basic Health Check
// Basic Health Check
app.get('/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// App Routes
import authRoutes from './routes/auth.routes';
import clinicRoutes from './routes/clinic.routes';
import patientRoutes from './routes/patient.routes';
import appointmentRoutes from './routes/appointment.routes';
import consultationRoutes from './routes/consultation.routes';
import billingRoutes from './routes/billing.routes';
import analyticsRoutes from './routes/analytics.routes';

app.use('/api/auth', authRoutes);
app.use('/api/clinics', clinicRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/consultations', consultationRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/analytics', analyticsRoutes);

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error(err.stack);

    if (err instanceof z.ZodError) {
        return res.status(400).json({
            status: 'error',
            message: 'Validation Error',
            errors: err.errors
        });
    }

    res.status(500).json({
        status: 'error',
        message: err.message || 'Internal Server Error'
    });
});

export default app;

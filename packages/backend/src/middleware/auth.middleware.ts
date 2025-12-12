import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthUser {
    id: string;
    email: string;
    role: string;
    clinic_id: string;
}

declare global {
    namespace Express {
        interface Request {
            user?: AuthUser;
        }
    }
}

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ status: 'error', message: 'Authentication required' });
    }

    // In production with Supabase, you might verify this differently (e.g. using supabase-js or verifying the JWT signature with the Supabase JWT secret)
    const secret = process.env.JWT_SECRET || 'super-secret-dev-key-change-in-prod';

    jwt.verify(token, secret, (err: any, user: any) => {
        if (err) {
            return res.status(403).json({ status: 'error', message: 'Invalid or expired token' });
        }

        // Transform or validate the user object if necessary to match AuthUser
        req.user = user as AuthUser;
        next();
    });
};

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { registerClinic, login } from '../controllers/auth.controller';
import { registerClinicSchema, loginSchema } from '../utils/validation';

const router = Router();

const validate = (schema: z.AnyZodObject) => (req: Request, res: Response, next: NextFunction) => {
    try {
        schema.parse({
            body: req.body,
            query: req.query,
            params: req.params,
        });
        next();
    } catch (err) {
        next(err);
    }
};

router.post('/register', validate(registerClinicSchema), registerClinic);
router.post('/login', validate(loginSchema), login);

export default router;

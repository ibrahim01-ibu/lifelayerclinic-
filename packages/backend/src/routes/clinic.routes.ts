import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod'; // Import z here
import { getClinicSettings, updateClinicSettings, getUsers, addUser } from '../controllers/clinic.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';
import { createUserSchema } from '../utils/validation';

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

router.use(authenticateToken);

// Settings
router.get('/settings', requireRole(['admin', 'manager']), getClinicSettings);
router.put('/settings', requireRole(['admin']), updateClinicSettings);

// Users
router.get('/users', requireRole(['admin', 'manager']), getUsers);
router.post('/users', requireRole(['admin']), validate(createUserSchema), addUser);

export default router;

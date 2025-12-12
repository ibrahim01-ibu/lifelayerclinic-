import { Router } from 'express';
import { getDashboardStats } from '../controllers/analytics.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';

const router = Router();

router.use(authenticateToken);

router.get('/dashboard', requireRole(['admin', 'manager', 'doctor']), getDashboardStats);

export default router;

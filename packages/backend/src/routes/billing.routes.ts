import { Router } from 'express';
import { createInvoice, getInvoices } from '../controllers/billing.controller';
import { authenticateToken, requireRole } from '../middleware/auth.middleware';
import { requireRole as requireRoleRbac } from '../middleware/rbac.middleware'; // Explicit import to avoid confusion if I messed up previous file imports

const router = Router();

router.use(authenticateToken);

router.post('/', requireRoleRbac(['admin', 'receptionist', 'manager']), createInvoice);
router.get('/', requireRoleRbac(['admin', 'receptionist', 'manager']), getInvoices);

export default router;

import { Router } from 'express';
import { getPatients, createPatient, getPatientById } from '../controllers/patient.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';

const router = Router();

router.use(authenticateToken);

router.get('/', requireRole(['doctor', 'receptionist', 'admin']), getPatients);
router.post('/', requireRole(['doctor', 'receptionist', 'admin']), createPatient);
router.get('/:id', requireRole(['doctor', 'receptionist', 'admin']), getPatientById);

export default router;

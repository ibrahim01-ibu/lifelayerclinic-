import { Router } from 'express';
import { getAppointments, createAppointment, checkInPatient, getQueueStatus } from '../controllers/appointment.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';

const router = Router();

router.use(authenticateToken);

router.get('/', getAppointments);
router.post('/', requireRole(['receptionist', 'admin', 'doctor']), createAppointment);
router.put('/:id/check-in', requireRole(['receptionist', 'admin']), checkInPatient);
router.get('/queue', getQueueStatus);

export default router;

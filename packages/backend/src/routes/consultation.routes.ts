import { Router } from 'express';
import { startConsultation, updateConsultation, createPrescription, getConsultationById } from '../controllers/consultation.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';

const router = Router();

router.use(authenticateToken);

router.post('/', requireRole(['doctor']), startConsultation);
router.get('/:id', requireRole(['doctor', 'admin']), getConsultationById);
router.put('/:id', requireRole(['doctor']), updateConsultation);
router.post('/prescription', requireRole(['doctor']), createPrescription);

export default router;

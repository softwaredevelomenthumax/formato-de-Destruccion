import express from 'express';
import * as controller from '../controllers/actasController.js';
import { requireRole } from '../middleware/auth.js';

const router = express.Router();

router.post('/', requireRole('admin_global', 'solicitante'), controller.createActa);
router.get('/', requireRole('administrador', 'admin_global', 'solicitante', 'aprobador_area', 'hse', 'planeacion'), controller.getActas);
router.get('/:id', requireRole('administrador', 'admin_global', 'solicitante', 'aprobador_area', 'hse', 'planeacion'), controller.getActaById);
router.put('/:id', requireRole('admin_global', 'solicitante', 'aprobador_area', 'hse', 'planeacion'), controller.updateActa);
router.delete('/:id', requireRole('admin_global', 'administrador_global', 'global_admin'), controller.deleteActa);
router.post('/:id/submit', requireRole('solicitante'), controller.submitActa);
router.post('/:id/approve', requireRole('aprobador_area', 'hse'), controller.approveActa);
router.post('/:id/notify-hse', requireRole('administrador', 'admin_global', 'aprobador_area'), controller.resendHseEmail);
router.post('/:id/notify-area-approver', requireRole('administrador', 'admin_global', 'aprobador_area', 'hse'), controller.resendAreaApproverEmail);
router.post('/:id/reject', requireRole('aprobador_area', 'hse'), controller.rejectActa);
router.post('/:id/return', requireRole('aprobador_area', 'hse'), controller.returnActa);

export default router;

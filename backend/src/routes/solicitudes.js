import express from 'express';
import * as controller from '../controllers/solicitudesController.js';

const router = express.Router();

router.post('/', controller.createSolicitud);
router.get('/', controller.getSolicitudes);
router.post('/:id/approve', controller.approveSolicitud);
router.post('/:id/reject', controller.rejectSolicitud);

export default router;

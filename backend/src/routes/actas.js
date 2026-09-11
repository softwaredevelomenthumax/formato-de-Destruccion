import express from 'express';
import * as controller from '../controllers/actasController.js';

const router = express.Router();

router.post('/', controller.createActa);
router.get('/', controller.getActas);
router.get('/:id', controller.getActaById);
router.put('/:id', controller.updateActa);
router.delete('/:id', controller.deleteActa);
router.post('/:id/submit', controller.submitActa);
router.post('/:id/approve', controller.approveActa);
router.post('/:id/reject', controller.rejectActa);
router.post('/:id/return', controller.returnActa);

export default router;

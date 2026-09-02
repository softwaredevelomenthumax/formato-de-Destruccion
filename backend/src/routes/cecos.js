import express from 'express';
import * as controller from '../controllers/cecosController.js';
import { requireRole } from '../middleware/auth.js';

const router = express.Router();

router.get('/', controller.getCecos);
router.post('/', requireRole('costos'), controller.createCeco);
router.put('/:id', requireRole('costos'), controller.updateCeco);
router.delete('/:id', requireRole('costos'), controller.deleteCeco);

export default router;
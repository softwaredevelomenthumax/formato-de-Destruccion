import express from 'express';
import * as controller from '../controllers/sapController.js';
import { requireRole } from '../middleware/auth.js';

const router = express.Router();
router.get('/', controller.getSapCodes);
router.post('/', requireRole('planeacion'), controller.createSapCode);
export default router;
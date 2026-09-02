import express from 'express';
import * as controller from '../controllers/invimaController.js';
import { requireRole } from '../middleware/auth.js';

const router = express.Router();

router.post('/', requireRole('planeacion'), controller.createInvimaProduct);
router.get('/', controller.getInvimaProducts);
router.put('/:id', requireRole('planeacion'), controller.updateInvimaProduct);
router.delete('/:id', requireRole('planeacion'), controller.deleteInvimaProduct);

export default router;

import express from 'express';
import * as controller from '../controllers/usersController.js';
import { requireRole } from '../middleware/auth.js';

const router = express.Router();

router.post('/', requireRole('administrador', 'admin_global'), controller.createUser);
router.get('/', requireRole('administrador', 'admin_global'), controller.getUsers);
router.post('/:id/test-email', requireRole('administrador', 'admin_global'), controller.sendTestEmail);
router.get('/:id', requireRole('administrador', 'admin_global'), controller.getUserById);
router.put('/:id', requireRole('administrador', 'admin_global'), controller.updateUser);
router.delete('/:id', requireRole('admin_global'), controller.deleteUser);

export default router;

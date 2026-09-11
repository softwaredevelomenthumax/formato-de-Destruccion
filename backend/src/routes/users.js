import express from 'express';
import * as controller from '../controllers/usersController.js';

const router = express.Router();

router.post('/', controller.createUser);
router.get('/', controller.getUsers);
router.post('/:id/test-email', controller.sendTestEmail);
router.get('/:id', controller.getUserById);
router.put('/:id', controller.updateUser);
router.delete('/:id', controller.deleteUser);

export default router;

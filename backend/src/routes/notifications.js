import express from 'express';
import * as controller from '../controllers/notificationsController.js';

const router = express.Router();

router.post('/', controller.createNotification);
router.get('/user/:userId', controller.getUserNotifications);
router.put('/:id/read', controller.markNotificationRead);
router.put('/user/:userId/read-all', controller.markAllNotificationsRead);

export default router;

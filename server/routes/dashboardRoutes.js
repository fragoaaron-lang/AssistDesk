const express = require('express');
const dashboardController = require('../controllers/dashboardController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.get('/', authMiddleware, dashboardController.getDashboard);
router.get('/notifications', authMiddleware, dashboardController.getNotifications);
router.put('/notifications/read', authMiddleware, dashboardController.markNotificationsRead);
router.delete('/notifications/:id', authMiddleware, dashboardController.deleteNotification);
router.post('/marker-positions', authMiddleware, dashboardController.saveMarkerPositions);
router.get('/marker-positions', authMiddleware, dashboardController.getMarkerPositions);

module.exports = router;
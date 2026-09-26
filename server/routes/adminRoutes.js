const express = require('express');
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/auth');
const authorize = require('../middleware/authorize');

const router = express.Router();

router.get('/reports', authMiddleware, authorize('admin'), adminController.getReports);
router.delete('/users/:id', authMiddleware, authorize('admin'), adminController.deleteUser);
router.post('/users/:id/reactivate', authMiddleware, authorize('admin'), adminController.reactivateUser);
router.post('/announcements', authMiddleware, authorize('admin'), adminController.createAnnouncement);

module.exports = router;

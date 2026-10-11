const express = require('express');
const pushController = require('../controllers/pushController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.get('/public-key', pushController.getPublicKey);
router.post('/subscriptions', authMiddleware, pushController.saveSubscription);
router.delete('/subscriptions', authMiddleware, pushController.deleteSubscription);

module.exports = router;
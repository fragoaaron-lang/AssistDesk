const express = require('express');
const aiController = require('../controllers/aiController');
const authMiddleware = require('../middleware/auth');
const { aiRequestLimiter } = require('../middleware/rateLimits');

const router = express.Router();

router.post('/ask', authMiddleware, aiRequestLimiter, aiController.askAssistant);
router.get('/history', authMiddleware, aiController.getMyChatHistory);

module.exports = router;

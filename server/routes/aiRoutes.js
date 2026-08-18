const express = require('express');
const aiController = require('../controllers/aiController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.post('/ask', authMiddleware, aiController.askAssistant);

module.exports = router;

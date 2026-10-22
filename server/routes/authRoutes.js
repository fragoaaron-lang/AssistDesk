const express = require('express');
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');
const { accountAppealLimiter, accountRecoveryLimiter, loginLimiter, registrationLimiter } = require('../middleware/rateLimits');

const router = express.Router();

router.post('/register', registrationLimiter, authController.register);
router.post('/verify-email', accountRecoveryLimiter, authController.verifyEmail);
router.post('/resend-email-verification', accountRecoveryLimiter, authController.resendEmailVerification);
router.post('/login', loginLimiter, authController.login);
router.post('/logout', authMiddleware, authController.logout);
router.post('/appeal', accountAppealLimiter, authMiddleware, authController.submitTerminationAppeal);
router.post('/forgot-password', accountRecoveryLimiter, authController.forgotPassword);
router.post('/reset-password', accountRecoveryLimiter, authController.resetPassword);
router.post('/change-password', authMiddleware, authController.changePassword);
router.delete('/delete-account', authMiddleware, authController.deleteAccount);
router.post('/profile', authMiddleware, authController.updateProfile);
router.get('/me', authMiddleware, authController.getMe);
router.get('/activity', authMiddleware, authController.getMyActivity);

module.exports = router;

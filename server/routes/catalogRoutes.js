const express = require('express');
const catalogController = require('../controllers/catalogController');
const authMiddleware = require('../middleware/auth');
const authorize = require('../middleware/authorize');

const router = express.Router();

router.get('/departments', authMiddleware, catalogController.getDepartments);
router.post('/departments', authMiddleware, authorize('admin'), catalogController.createDepartment);
router.put('/departments/:id', authMiddleware, authorize('admin'), catalogController.updateDepartment);
router.delete('/departments/:id', authMiddleware, authorize('admin'), catalogController.deleteDepartment);

router.get('/services', authMiddleware, catalogController.getServices);
router.post('/services', authMiddleware, authorize('admin'), catalogController.createService);
router.put('/services/:id', authMiddleware, authorize('admin'), catalogController.updateService);
router.delete('/services/:id', authMiddleware, authorize('admin'), catalogController.deleteService);

router.get('/faqs', authMiddleware, catalogController.getFaqs);
router.post('/faqs', authMiddleware, authorize('admin'), catalogController.createFaq);
router.put('/faqs/:id', authMiddleware, authorize('admin'), catalogController.updateFaq);
router.delete('/faqs/:id', authMiddleware, authorize('admin'), catalogController.deleteFaq);

module.exports = router;

const express = require('express');
const catalogController = require('../controllers/catalogController');
const issueCatalogController = require('../controllers/issueCatalogController');
const authMiddleware = require('../middleware/auth');
const authorize = require('../middleware/authorize');

const router = express.Router();

router.get('/departments', catalogController.getDepartments);
router.get('/departments/manage', authMiddleware, authorize('admin'), catalogController.getDepartments);
router.post('/departments', authMiddleware, authorize('admin'), catalogController.createDepartment);
router.put('/departments/:id', authMiddleware, authorize('admin'), catalogController.updateDepartment);
router.delete('/departments/:id', authMiddleware, authorize('admin'), catalogController.deleteDepartment);

router.get('/services', authMiddleware, catalogController.getServices);
router.post('/services', authMiddleware, authorize('admin'), catalogController.createService);
router.put('/services/:id', authMiddleware, authorize('admin'), catalogController.updateService);
router.delete('/services/:id', authMiddleware, authorize('admin'), catalogController.deleteService);

router.get('/issues', authMiddleware, issueCatalogController.getIssues);
router.post('/issues', authMiddleware, authorize('admin'), issueCatalogController.createGeneralIssue);
router.put('/issues/:id', authMiddleware, authorize('admin'), issueCatalogController.updateGeneralIssue);
router.delete('/issues/:id', authMiddleware, authorize('admin'), issueCatalogController.deleteGeneralIssue);
router.post('/issues/:id/specific', authMiddleware, authorize('admin'), issueCatalogController.createSpecificIssue);
router.put('/specific-issues/:id', authMiddleware, authorize('admin'), issueCatalogController.updateSpecificIssue);
router.delete('/specific-issues/:id', authMiddleware, authorize('admin'), issueCatalogController.deleteSpecificIssue);

router.get('/faqs', authMiddleware, catalogController.getFaqs);
router.post('/faqs', authMiddleware, authorize('admin'), catalogController.createFaq);
router.put('/faqs/:id', authMiddleware, authorize('admin'), catalogController.updateFaq);
router.delete('/faqs/:id', authMiddleware, authorize('admin'), catalogController.deleteFaq);

module.exports = router;

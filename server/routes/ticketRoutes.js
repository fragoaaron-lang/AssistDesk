const express = require('express');
const ticketController = require('../controllers/ticketController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.post('/', authMiddleware, ticketController.createTicket);
router.get('/', authMiddleware, ticketController.getTickets);
router.get('/:id', authMiddleware, ticketController.getTicketById);
router.put('/:id/status', authMiddleware, ticketController.updateTicketStatus);
router.put('/:id/eta', authMiddleware, ticketController.updateTicketEta);
router.delete('/:id', authMiddleware, ticketController.deleteTicket);
router.post('/:id/updates', authMiddleware, ticketController.addTicketUpdate);

module.exports = router;

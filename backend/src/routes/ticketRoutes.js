const router = require('express').Router();
const ticketController = require('../controllers/ticketController');
const commentController = require('../controllers/commentController');
const authenticate = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');

router.use(authenticate);

// Ticket Stats
router.get('/stats', requireRole('agent'), ticketController.getStats);

// Base Ticket CRUD
router.get('/', ticketController.getTickets);
router.post('/', ticketController.createTicket);
router.get('/:id', ticketController.getTicketById);
router.put('/:id', requireRole('agent'), ticketController.updateTicket);
router.delete('/:id', requireRole('agent'), ticketController.deleteTicket);

// Ticket Comments
router.get('/:id/comments', commentController.getComments);
router.post('/:id/comments', commentController.addComment);

module.exports = router;

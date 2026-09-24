const router = require('express').Router();
const userController = require('../controllers/userController');
const authenticate = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');

router.get('/', authenticate, requireRole('agent'), userController.getUsers);

module.exports = router;

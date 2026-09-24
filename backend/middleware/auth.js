const authenticate = require('../src/middleware/authMiddleware');
const requireRole = require('../src/middleware/roleMiddleware');

module.exports = {
  authenticate,
  requireRole
};

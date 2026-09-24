const router = require('express').Router({ mergeParams: true });
const commentController = require('../controllers/commentController');
const authenticate = require('../middleware/authMiddleware');

router.use(authenticate);

router.get('/', commentController.getComments);
router.post('/', commentController.addComment);

module.exports = router;

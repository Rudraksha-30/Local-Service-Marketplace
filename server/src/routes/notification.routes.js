const router = require('express').Router();
const { protect } = require('../middleware/auth');
const ctrl = require('../controllers/notification.controller');

router.use(protect);
router.get('/', ctrl.list);
router.get('/unread-count', ctrl.unreadCount);
router.post('/read-all', ctrl.markAllRead);
router.patch('/:id/read', ctrl.markRead);

module.exports = router;

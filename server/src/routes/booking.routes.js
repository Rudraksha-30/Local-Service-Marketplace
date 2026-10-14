const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect, authorize } = require('../middleware/auth');
const { STATUS } = require('../services/bookingStateMachine');
const ctrl = require('../controllers/booking.controller');
const messageCtrl = require('../controllers/message.controller');
const disputeCtrl = require('../controllers/dispute.controller');
const reviewCtrl = require('../controllers/review.controller');

router.use(protect);

router.post(
  '/',
  authorize('customer'),
  [
    body('providerId').isMongoId().withMessage('providerId must be a valid id'),
    body('category').isString().trim().notEmpty().withMessage('category is required'),
    body('scheduledStart').isISO8601().withMessage('scheduledStart must be an ISO date-time'),
    body('durationMinutes').optional().isInt({ min: 15, max: 480 }).toInt(),
    body('notes').optional().isString().isLength({ max: 500 }),
    body('address').optional().isString().isLength({ max: 200 }),
  ],
  validate,
  ctrl.createBooking
);

router.get('/', authorize('customer', 'provider'), ctrl.listMyBookings);
router.get('/:id', ctrl.getBooking);

router.patch(
  '/:id/status',
  authorize('customer', 'provider'),
  [
    body('status').isIn(Object.values(STATUS)).withMessage('Unknown status'),
    body('reason').optional().isString().isLength({ max: 300 }),
  ],
  validate,
  ctrl.updateStatus
);

// Chat thread for this booking (FR-22)
router.get('/:id/messages', authorize('customer', 'provider'), messageCtrl.list);
router.post(
  '/:id/messages',
  authorize('customer', 'provider'),
  [body('text').isString().trim().isLength({ min: 1, max: 1000 }).withMessage('Message must be 1 to 1000 characters')],
  validate,
  messageCtrl.send
);

// Review and disputes attached to this booking
router.get('/:bookingId/review', authorize('customer', 'provider'), reviewCtrl.getForBooking);
router.get('/:bookingId/disputes', disputeCtrl.listForBooking);

module.exports = router;

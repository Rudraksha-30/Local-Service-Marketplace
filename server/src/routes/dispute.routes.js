const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/dispute.controller');

router.post(
  '/',
  protect,
  authorize('customer', 'provider'),
  [
    body('bookingId').isMongoId().withMessage('bookingId must be a valid id'),
    body('reason').isString().trim().isLength({ min: 10, max: 500 }).withMessage('Please describe the problem in 10 to 500 characters'),
  ],
  validate,
  ctrl.create
);

module.exports = router;

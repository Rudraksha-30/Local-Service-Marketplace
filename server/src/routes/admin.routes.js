const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/admin.controller');

router.use(protect, authorize('admin'));

router.get('/stats', ctrl.stats);
router.get('/providers', ctrl.listProviders);
router.patch(
  '/providers/:id/verify',
  [body('isVerified').isBoolean().withMessage('isVerified must be true or false').toBoolean()],
  validate,
  ctrl.setVerified
);
router.get('/disputes', ctrl.listDisputes);
router.patch(
  '/disputes/:id/resolve',
  [
    body('outcome').isIn(['provider_at_fault', 'customer_at_fault', 'no_fault']).withMessage('Choose an outcome'),
    body('adminNote').optional().isString().isLength({ max: 500 }),
  ],
  validate,
  ctrl.resolveDispute
);

module.exports = router;

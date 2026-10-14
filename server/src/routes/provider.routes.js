const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/provider.controller');
const reviewCtrl = require('../controllers/review.controller');

// Public browsing (FR-8, FR-9, FR-10)
router.get('/', ctrl.listProviders);
router.get('/meta/categories', ctrl.listCategories);

// Provider's own listing (FR-6, FR-7). Declared BEFORE '/:id' so "me" isn't read as an id.
router.get('/me/profile', protect, authorize('provider'), ctrl.getMyProfile);
router.put(
  '/me/profile',
  protect,
  authorize('provider'),
  [
    body('headline').optional().isString().isLength({ max: 120 }),
    body('description').optional().isString().isLength({ max: 1000 }),
    body('categories').optional().isArray({ max: 10 }).withMessage('categories must be a list'),
    body('categories.*').optional().isString(),
    body('serviceArea').optional().isString().trim(),
    body('priceMin').optional().isFloat({ min: 0 }),
    body('priceMax').optional().isFloat({ min: 0 }),
    body('isActive').optional().isBoolean(),
  ],
  validate,
  ctrl.upsertMyProfile
);

router.get('/:id', ctrl.getProvider);
router.get('/:profileId/reviews', reviewCtrl.listForProvider);

module.exports = router;

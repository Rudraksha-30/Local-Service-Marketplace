const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const ctrl = require('../controllers/auth.controller');

router.post(
  '/register',
  [
    body('name').isString().trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
    body('password').isString().isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('phone').optional().isString().trim(),
    // Only these two roles can be chosen at sign-up; admin is created manually
    body('role').isIn(['customer', 'provider']).withMessage('Role must be customer or provider'),
  ],
  validate,
  ctrl.register
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
    body('password').isString().notEmpty().withMessage('Password is required'),
  ],
  validate,
  ctrl.login
);

router.get('/me', protect, ctrl.me);
router.patch(
  '/me',
  protect,
  [body('name').optional().isString().trim().notEmpty(), body('phone').optional().isString().trim()],
  validate,
  ctrl.updateMe
);

router.post('/refresh', ctrl.refresh);
router.post('/logout', ctrl.logout);

module.exports = router;

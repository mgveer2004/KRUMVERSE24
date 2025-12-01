const { body, validationResult } = require('express-validator');

// ============================================
// VALIDATION HELPER
// ============================================
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.param,
        message: err.msg
      }))
    });
  }
  next();
};

// ============================================
// SIGNUP VALIDATION
// ============================================
const signupValidation = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage('Username must be 3-20 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain uppercase, lowercase, and number'),
  
  body('role')
    .optional()
    .isIn(['player', 'organizer', 'admin'])
    .withMessage('Invalid role')
];

// ============================================
// LOGIN VALIDATION
// ============================================
const loginValidation = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

// ============================================
// TOURNAMENT VALIDATION
// ============================================
const tournamentValidation = [
  body('name')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Tournament name must be 3-100 characters'),
  
  body('gameId')
    .notEmpty()
    .withMessage('Game ID is required'),
  
  body('startDate')
    .notEmpty()
    .withMessage('Start date is required')
    .custom(value => {
      if (new Date(value) <= new Date()) {
        throw new Error('Start date must be in the future');
      }
      return true;
    }),
  
  body('maxParticipants')
    .optional()
    .isInt({ min: 2, max: 1000 })
    .withMessage('Max participants must be between 2-1000'),
  
  body('registrationFee')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Registration fee must be non-negative')
];

// ============================================
// PASSWORD RESET VALIDATION
// ============================================
const passwordResetValidation = [
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain uppercase, lowercase, and number')
];

module.exports = {
  validate,
  signupValidation,
  loginValidation,
  tournamentValidation,
  passwordResetValidation
};

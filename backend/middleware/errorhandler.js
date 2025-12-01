// ============================================
// GLOBAL ERROR HANDLER MIDDLEWARE
// Use this in server.js: app.use(errorHandler)
// ============================================

const errorHandler = (err, req, res, next) => {
  console.error('❌ Error:', err.message);

  // Default error values
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let errors = [];

  // ============================================
  // MONGOOSE VALIDATION ERRORS
  // ============================================
  if (err.name === 'ValidationError') {
    statusCode = 400;
    errors = Object.values(err.errors).map(e => e.message);
    message = 'Validation Error';

    return res.status(statusCode).json({
      success: false,
      message: message,
      errors: errors
    });
  }

  // ============================================
  // MONGOOSE DUPLICATE KEY ERROR (like duplicate email)
  // ============================================
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue);
    message = `${field} already exists`;

    return res.status(statusCode).json({
      success: false,
      message: message
    });
  }

  // ============================================
  // JWT ERRORS
  // ============================================
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid or malformed token';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token has expired. Please login again.';
  }

  // ============================================
  // MONGODB OBJECT ID ERROR
  // ============================================
  if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format';
  }

  // ============================================
  // MULTER FILE UPLOAD ERRORS
  // ============================================
  if (err.name === 'MulterError') {
    statusCode = 400;
    message = `File upload error: ${err.message}`;
  }

  // ============================================
  // SEND ERROR RESPONSE
  // ============================================
  res.status(statusCode).json({
    success: false,
    message: message,
    ...(errors.length > 0 && { errors: errors }),
    // Include stack trace only in development
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;

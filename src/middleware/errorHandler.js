/**
 * @desc Global Error Handling Middleware
 * Ensures all errors return a consistent JSON response
 * Hides stack traces in production for security
 */
const errorHandler = (err, req, res, next) => {
  // Determine status code based on error type or existing res.statusCode
  let statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;

  // Custom mapping for common error types
  if (err.name === 'ValidationError') statusCode = 400;
  if (err.name === 'CastError') statusCode = 404;
  
  if (err.message && (err.message.includes('required') || err.message.includes('Invalid') || err.message.includes('failed'))) {
    statusCode = 400;
  }
  if (err.message && (err.message === 'Invalid credentials' || err.message === 'Credentials missing')) {
    statusCode = 401;
  }
  if (err.message === 'User not found') {
    statusCode = 404;
  }

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

module.exports = { errorHandler };

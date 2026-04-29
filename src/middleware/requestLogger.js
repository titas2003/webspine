/**
 * @desc  Request Logger Middleware Factory
 * Creates an Express middleware that logs every incoming API request
 * including method, URL, status code, response time, and user identity.
 *
 * @param {object} logger  A Winston logger instance (clientLogger / advocateLogger / adminLogger)
 * @returns Express middleware function
 */
const requestLogger = (logger) => (req, res, next) => {
  const startTime = Date.now();

  // Intercept res.json to capture the status code after it's set
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const userId = req.user
      ? (req.user.clientId || req.user.advId || req.user._id || 'authenticated')
      : 'unauthenticated';

    const level = res.statusCode >= 500 ? 'error'
                : res.statusCode >= 400 ? 'warn'
                : 'info';

    logger[level](
      `${req.method} ${req.originalUrl}`,
      {
        status:   res.statusCode,
        duration: `${duration}ms`,
        ip:       req.ip || req.connection?.remoteAddress || 'unknown',
        userId,
        userAgent: req.headers['user-agent'] || 'unknown'
      }
    );
  });

  next();
};

module.exports = requestLogger;

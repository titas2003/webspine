const winston = require('winston');
require('winston-daily-rotate-file');
const path = require('path');

const LOG_DIR = path.join(process.cwd(), 'logs');

/**
 * @desc  Factory: Create a named Winston logger writing to a specific log file.
 *        Each file rotates daily and is retained for 30 days.
 * @param {string} name  e.g. 'client', 'advocate', 'admin'
 */
const createLogger = (name) => {
  return winston.createLogger({
    level: 'info',
    format: winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.printf(({ timestamp, level, message, ...meta }) => {
        const metaStr = Object.keys(meta).length ? ' | ' + JSON.stringify(meta) : '';
        return `[${timestamp}] ${level.toUpperCase()} ${message}${metaStr}`;
      })
    ),
    transports: [
      // Daily rotating file transport
      new winston.transports.DailyRotateFile({
        filename: path.join(LOG_DIR, `${name}-%DATE%.log`),
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxFiles: '30d',
        // Today's file is also symlinked at the base name
        symlinkName: `${name}.log`,
        createSymlink: true,
      }),
      // Console transport (development only)
      ...(process.env.NODE_ENV !== 'production'
        ? [new winston.transports.Console({
            format: winston.format.combine(
              winston.format.colorize(),
              winston.format.printf(({ level, message, ...meta }) => {
                const metaStr = Object.keys(meta).length ? ' | ' + JSON.stringify(meta) : '';
                return `[${name.toUpperCase()}] ${level}: ${message}${metaStr}`;
              })
            )
          })]
        : [])
    ]
  });
};

// Named logger instances
const clientLogger   = createLogger('client');
const advocateLogger = createLogger('advocate');
const adminLogger    = createLogger('admin');

module.exports = { clientLogger, advocateLogger, adminLogger };

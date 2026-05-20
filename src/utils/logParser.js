const fs = require('fs');
const path = require('path');

const LOG_DIR = path.join(process.cwd(), 'logs');

/**
 * Log line format (from Winston):
 * [2026-05-20 11:51:50] INFO POST /api/admin/login | {"status":200,"duration":"363ms","ip":"::1",...}
 */
const LOG_LINE_REGEX = /^\[(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\] (\w+) (.*?)(?:\s+\|\s+(\{.*\}))?$/;

/**
 * Parse a single log line into a structured object.
 */
const parseLine = (line) => {
  const trimmed = line.trim();
  if (!trimmed) return null;

  const match = trimmed.match(LOG_LINE_REGEX);
  if (!match) return null;

  const [, timestamp, level, message, metaStr] = match;

  let meta = {};
  if (metaStr) {
    try {
      meta = JSON.parse(metaStr);
    } catch (_) {
      meta = { raw: metaStr };
    }
  }

  return {
    timestamp,
    level: level.toLowerCase(),
    message: message.trim(),
    ...meta
  };
};

/**
 * Read a log file and return structured JSON entries, newest first.
 * @param {string} role - 'advocate' | 'client' | 'admin'
 * @param {object} options
 * @param {number} options.limit   - Max lines to return (default 200)
 * @param {string} options.level   - Filter by log level e.g. 'error', 'info'
 * @param {string} options.date    - Specific date 'YYYY-MM-DD' (default: today's file)
 */
exports.parseLogFile = (role, options = {}) => {
  const { limit = 200, level, date } = options;

  // Determine filename: prefer today's dated file, fall back to symlink
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const targetDate = date || today;
  const datedFile = path.join(LOG_DIR, `${role}-${targetDate}.log`);
  const symlinkFile = path.join(LOG_DIR, `${role}.log`);

  // Pick which file to read
  let filePath = null;
  if (fs.existsSync(datedFile)) {
    filePath = datedFile;
  } else if (fs.existsSync(symlinkFile)) {
    filePath = symlinkFile;
  }

  if (!filePath) {
    return { entries: [], filePath: null, totalLines: 0 };
  }

  let content = '';
  try {
    content = fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    return { entries: [], filePath, error: err.message };
  }

  const lines = content.split('\n').filter(l => l.trim());

  // Parse all lines
  let parsed = lines
    .map(parseLine)
    .filter(Boolean);

  // Filter by level if requested
  if (level) {
    parsed = parsed.filter(e => e.level === level.toLowerCase());
  }

  // Newest first, then limit
  parsed.reverse();
  parsed = parsed.slice(0, limit);

  return {
    filePath: filePath.replace(process.cwd(), ''),
    totalLines: lines.length,
    returned: parsed.length,
    entries: parsed
  };
};

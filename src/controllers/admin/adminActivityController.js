const { parseLogFile } = require('../../utils/logParser');

/**
 * @desc    Get Advocate activity logs (from log file)
 * @route   GET /api/admin/activity/advocate
 * @access  Protected (Admin only)
 * @query   limit, level, date (YYYY-MM-DD)
 */
exports.getAdvocateLogs = (req, res) => {
  try {
    const { limit, level, date } = req.query;
    const result = parseLogFile('advocate', {
      limit: limit ? parseInt(limit, 10) : 200,
      level,
      date
    });

    res.status(200).json({
      success: true,
      role: 'advocate',
      ...result
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get Client activity logs (from log file)
 * @route   GET /api/admin/activity/client
 * @access  Protected (Admin only)
 * @query   limit, level, date (YYYY-MM-DD)
 */
exports.getClientLogs = (req, res) => {
  try {
    const { limit, level, date } = req.query;
    const result = parseLogFile('client', {
      limit: limit ? parseInt(limit, 10) : 200,
      level,
      date
    });

    res.status(200).json({
      success: true,
      role: 'client',
      ...result
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get Admin activity logs (from log file)
 * @route   GET /api/admin/activity/admin
 * @access  Protected (Admin only)
 * @query   limit, level, date (YYYY-MM-DD)
 */
exports.getAdminLogs = (req, res) => {
  try {
    const { limit, level, date } = req.query;
    const result = parseLogFile('admin', {
      limit: limit ? parseInt(limit, 10) : 200,
      level,
      date
    });

    res.status(200).json({
      success: true,
      role: 'admin',
      ...result
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

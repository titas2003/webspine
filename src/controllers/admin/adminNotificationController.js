const User = require('../../models/User');
const Advocates = require('../../models/Advocates');
const mailer = require('../../utils/mailer');

/**
 * @desc    Send bulk email to all verified advocates
 * @route   POST /api/admin/notifications/advocates
 * @access  Protected (Admin only)
 */
exports.sendBulkMailToAdvocates = async (req, res) => {
  try {
    const { subject, bodyHtml } = req.body;

    if (!subject || !bodyHtml) {
      return res.status(400).json({ success: false, message: 'Subject and bodyHtml are required' });
    }

    // Only send to Verified advocates
    const advocates = await Advocates.find({ vStatus: 'Verified' }).select('email');
    const emails = advocates.map(a => a.email).filter(Boolean);

    if (emails.length === 0) {
      return res.status(404).json({ success: false, message: 'No verified advocates found to email' });
    }

    // Call mailer
    await mailer.sendAdminBulkNotification(emails, subject, bodyHtml);

    res.status(200).json({
      success: true,
      message: `Bulk email dispatched to ${emails.length} advocates.`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Send bulk email to all clients
 * @route   POST /api/admin/notifications/clients
 * @access  Protected (Admin only)
 */
exports.sendBulkMailToClients = async (req, res) => {
  try {
    const { subject, bodyHtml } = req.body;

    if (!subject || !bodyHtml) {
      return res.status(400).json({ success: false, message: 'Subject and bodyHtml are required' });
    }

    // Fetch all clients
    const clients = await User.find().select('email');
    const emails = clients.map(c => c.email).filter(Boolean);

    if (emails.length === 0) {
      return res.status(404).json({ success: false, message: 'No clients found to email' });
    }

    // Call mailer
    await mailer.sendAdminBulkNotification(emails, subject, bodyHtml);

    res.status(200).json({
      success: true,
      message: `Bulk email dispatched to ${emails.length} clients.`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

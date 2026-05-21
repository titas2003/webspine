const User = require('../../models/User');
const Appointment = require('../../models/Appointment');
const nodemailer = require('nodemailer');

// Internal mail sender
const sendMail = async ({ to, subject, html }) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.MAILID, pass: process.env.MAILKEY }
    });
    await transporter.sendMail({ from: `"MacclouSpine" <${process.env.MAILID}>`, to, subject, html });
  } catch (e) {
    console.error('[AdvClientVerify] Mail error:', e.message);
  }
};

// Helper to build full URL for local file paths
const fileUrl = (p) => (p ? `http://localhost:5006/${p.replace(/\\/g, '/')}` : null);

// ---------------------------------------------------------------------------
// @desc    List all clients who had appointments with this advocate
//          including their vStatus & doc presence
// @route   GET /api/advocate/clients
// ---------------------------------------------------------------------------
exports.getAdvocateClients = async (req, res) => {
  try {
    const { status, search } = req.query;

    // 1. Get all appointments for this advocate
    const appointments = await Appointment.find({ advocateId: req.user._id })
      .populate('clientId', 'name email phone clientId vStatus verificationDocs docVerification photo createdAt')
      .sort({ createdAt: -1 });

    // 2. Deduplicate clients, track last appointment date
    const seen = new Map();
    for (const appt of appointments) {
      if (!appt.clientId) continue;
      const cid = String(appt.clientId._id);
      if (!seen.has(cid)) {
        seen.set(cid, {
          _id: appt.clientId._id,
          clientId: appt.clientId.clientId,
          name: appt.clientId.name,
          email: appt.clientId.email,
          phone: appt.clientId.phone,
          vStatus: appt.clientId.vStatus,
          photo: fileUrl(appt.clientId.photo),
          verificationDocs: {
            aadharImage: fileUrl(appt.clientId.verificationDocs?.aadharImage),
            panImage:    fileUrl(appt.clientId.verificationDocs?.panImage),
            videoUrl:    fileUrl(appt.clientId.verificationDocs?.videoUrl),
          },
          docVerification: {
            aadhar: appt.clientId.docVerification?.aadhar || 'pending',
            pan:    appt.clientId.docVerification?.pan    || 'pending',
            video:  appt.clientId.docVerification?.video  || 'pending',
          },
          memberSince: appt.clientId.createdAt,
          lastAppointment: appt.scheduledAt || appt.createdAt,
          appointmentCount: 1,
        });
      } else {
        seen.get(cid).appointmentCount += 1;
      }
    }

    let clients = Array.from(seen.values());

    // 3. Filter by vStatus
    if (status && status !== 'All') {
      clients = clients.filter(c => c.vStatus === status);
    }

    // 4. Filter by search term
    if (search) {
      const q = search.toLowerCase();
      clients = clients.filter(c =>
        c.name?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.clientId?.toLowerCase().includes(q)
      );
    }

    // 5. Build stats
    const all = Array.from(seen.values());
    const stats = {
      total: all.length,
      verified: all.filter(c => c.vStatus === 'Verified').length,
      pending: all.filter(c => c.vStatus === 'Pending').length,
      rejected: all.filter(c => c.vStatus === 'Rejected').length,
    };

    res.status(200).json({ success: true, stats, count: clients.length, data: clients });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ---------------------------------------------------------------------------
// @desc    Advocate updates a client's vStatus (Verified / Rejected)
// @route   PATCH /api/advocate/clients/:clientId/verify
// @body    { vStatus: 'Verified' | 'Rejected', reason?: string }
// ---------------------------------------------------------------------------
exports.updateClientVStatus = async (req, res) => {
  try {
    const { vStatus, reason } = req.body;
    const validStatuses = ['Verified', 'Rejected', 'Pending'];

    if (!validStatuses.includes(vStatus)) {
      return res.status(400).json({ success: false, message: `vStatus must be one of: ${validStatuses.join(', ')}` });
    }

    // Ensure this client had an appointment with this advocate
    const appointment = await Appointment.findOne({
      advocateId: req.user._id,
      clientId: req.params.clientId,
    });
    if (!appointment) {
      return res.status(403).json({ success: false, message: 'This client has no appointment with you' });
    }

    const client = await User.findById(req.params.clientId);
    if (!client) return res.status(404).json({ success: false, message: 'Client not found' });

    const prevStatus = client.vStatus;
    client.vStatus = vStatus;
    await client.save();

    // Send email notification to client
    const statusEmoji = vStatus === 'Verified' ? '✅' : vStatus === 'Rejected' ? '❌' : '🔄';
    const advName = req.user.name || 'Your Advocate';
    await sendMail({
      to: client.email,
      subject: `${statusEmoji} Your KYC verification status has been updated`,
      html: `
        <div style="font-family:sans-serif;max-width:540px;margin:auto">
          <h2 style="color:#1a2b4b">KYC Status Update</h2>
          <p>Dear <strong>${client.name}</strong>,</p>
          <p>Your identity verification status has been updated by <strong>Adv. ${advName}</strong>.</p>
          <table style="border-collapse:collapse;width:100%;margin:16px 0">
            <tr style="background:#f8fafc">
              <td style="padding:10px 16px;font-weight:600;color:#64748b">Previous Status</td>
              <td style="padding:10px 16px">${prevStatus}</td>
            </tr>
            <tr>
              <td style="padding:10px 16px;font-weight:600;color:#64748b">New Status</td>
              <td style="padding:10px 16px;font-weight:700;color:${vStatus === 'Verified' ? '#16a34a' : vStatus === 'Rejected' ? '#dc2626' : '#d97706'}">${vStatus}</td>
            </tr>
            ${reason ? `<tr style="background:#f8fafc"><td style="padding:10px 16px;font-weight:600;color:#64748b">Note from Advocate</td><td style="padding:10px 16px">${reason}</td></tr>` : ''}
          </table>
          ${vStatus === 'Rejected' ? `<p style="color:#dc2626">Please log in to your MacclouSpine account and re-upload your documents to get verified.</p>` : ''}
          <p style="color:#64748b;font-size:13px;margin-top:24px">— MacclouSpine Legal Platform</p>
        </div>
      `
    });

    res.status(200).json({
      success: true,
      message: `Client ${vStatus.toLowerCase()} and notified via email`,
      data: { vStatus: client.vStatus, clientId: client._id }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ---------------------------------------------------------------------------
// @desc    Advocate sends a "re-review your documents" notification to client
// @route   POST /api/advocate/clients/:clientId/notify
// @body    { message?: string }
// ---------------------------------------------------------------------------
exports.notifyClientForReview = async (req, res) => {
  try {
    const { message } = req.body;

    // Ensure this client had an appointment with this advocate
    const appointment = await Appointment.findOne({
      advocateId: req.user._id,
      clientId: req.params.clientId,
    });
    if (!appointment) {
      return res.status(403).json({ success: false, message: 'This client has no appointment with you' });
    }

    const client = await User.findById(req.params.clientId);
    if (!client) return res.status(404).json({ success: false, message: 'Client not found' });

    const advName = req.user.name || 'Your Advocate';
    const customMsg = message?.trim() || 'We have identified a potential issue with your submitted verification documents. Please review and re-upload your KYC documents at your earliest convenience.';

    await sendMail({
      to: client.email,
      subject: '⚠️ Action Required: Please review your KYC documents',
      html: `
        <div style="font-family:sans-serif;max-width:540px;margin:auto">
          <div style="background:#fef3c7;border-left:4px solid #f59e0b;padding:16px 20px;border-radius:6px;margin-bottom:20px">
            <strong style="color:#92400e">⚠️ Document Review Required</strong>
          </div>
          <h2 style="color:#1a2b4b">Action Required</h2>
          <p>Dear <strong>${client.name}</strong>,</p>
          <p>Your advocate <strong>Adv. ${advName}</strong> has flagged your KYC submission for review.</p>
          <blockquote style="border-left:3px solid #e2e8f0;margin:16px 0;padding:12px 20px;color:#475569;background:#f8fafc;border-radius:4px">
            ${customMsg}
          </blockquote>
          <p>Please log in to your <strong>MacclouSpine</strong> account and re-upload your verification documents to continue using legal services.</p>
          <p style="color:#64748b;font-size:13px;margin-top:24px">— MacclouSpine Legal Platform</p>
        </div>
      `
    });

    res.status(200).json({ success: true, message: 'Notification sent to client successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ---------------------------------------------------------------------------
// @desc    Advocate marks a specific document as verified/rejected/pending
// @route   PATCH /api/advocate/clients/:clientId/verify-doc
// @body    { doc: 'aadhar'|'pan'|'video', status: 'verified'|'rejected'|'pending' }
// ---------------------------------------------------------------------------
exports.verifyClientDoc = async (req, res) => {
  try {
    const { doc, status } = req.body;
    const validDocs = ['aadhar', 'pan', 'video'];
    const validStatuses = ['verified', 'rejected', 'pending'];

    if (!validDocs.includes(doc)) {
      return res.status(400).json({ success: false, message: `doc must be one of: ${validDocs.join(', ')}` });
    }
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: `status must be one of: ${validStatuses.join(', ')}` });
    }

    // Ensure client had an appointment with this advocate
    const appointment = await Appointment.findOne({
      advocateId: req.user._id,
      clientId: req.params.clientId,
    });
    if (!appointment) {
      return res.status(403).json({ success: false, message: 'This client has no appointment with you' });
    }

    const client = await User.findById(req.params.clientId);
    if (!client) return res.status(404).json({ success: false, message: 'Client not found' });

    // Update only this doc's status
    if (!client.docVerification) client.docVerification = {};
    client.docVerification[doc] = status;
    client.markModified('docVerification');

    // Auto-update overall vStatus based on all docs:
    // If ALL uploaded docs are verified → Verified
    // If ANY is rejected → Rejected
    // Otherwise → Pending
    const dv = client.docVerification;
    const hasDocs = {
      aadhar: !!client.verificationDocs?.aadharImage,
      pan:    !!client.verificationDocs?.panImage,
      video:  !!client.verificationDocs?.videoUrl,
    };
    const uploadedDocs = Object.keys(hasDocs).filter(k => hasDocs[k]);
    if (uploadedDocs.length > 0) {
      const statuses = uploadedDocs.map(k => dv[k] || 'pending');
      if (statuses.every(s => s === 'verified')) {
        client.vStatus = 'Verified';
      } else if (statuses.some(s => s === 'rejected')) {
        client.vStatus = 'Rejected';
      } else {
        client.vStatus = 'Pending';
      }
    }

    await client.save();

    res.status(200).json({
      success: true,
      message: `${doc.toUpperCase()} marked as ${status}`,
      data: {
        docVerification: client.docVerification,
        vStatus: client.vStatus
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const nodemailer = require('nodemailer');

/**
 * @desc  Core send helper — fire-and-forget safe
 * Transporter is created lazily so dotenv has already loaded by the time
 * process.env.MAILID / MAILKEY are read.
 * A mail failure will log but NEVER crash the API response.
 */
const sendMail = async ({ to, subject, html }) => {
  try {
    // Create transporter here (lazy) — env vars are available by now
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.MAILID,
        pass: process.env.MAILKEY
      }
    });

    await transporter.sendMail({
      from: `"MacclouSpine" <${process.env.MAILID}>`,
      to,
      subject,
      html
    });
  } catch (err) {
    console.error(`[Mailer] Failed to send mail to ${to}:`, err.message);
  }
};

// ---------------------------------------------------------------------------
// TEMPLATES
// ---------------------------------------------------------------------------

/**
 * @desc  Welcome email after signup (client or advocate)
 * @param {string} userId  clientId for clients, advId for advocates
 */
exports.sendWelcomeMail = (to, name, role = 'user', userId = null) => {
  const roleLabel = role === 'advocate' ? 'Advocate' : role === 'admin' ? 'Admin' : 'Client';
  const idLabel   = role === 'advocate' ? 'Advocate ID' : role === 'admin' ? 'ADM ID' : 'Client ID';
  return sendMail({
    to,
    subject: '🎉 Welcome to MacclouSpine!',
    html: `
      <h2>Welcome, ${name}!</h2>
      <p>Your <strong>${roleLabel}</strong> account on <strong>MacclouSpine</strong> has been created successfully.</p>
      ${userId ? `
      <table style="border-collapse:collapse;margin:12px 0;background:#f4f4f4;border-radius:6px;padding:12px">
        <tr>
          <td style="padding:8px 16px;font-size:14px"><strong>${idLabel}:</strong></td>
          <td style="padding:8px 16px;font-size:16px;font-family:monospace;letter-spacing:2px;color:#333"><strong>${userId}</strong></td>
        </tr>
      </table>
      <p style="font-size:13px;color:#555">Keep this ID handy — you can use it to log in to your account.</p>
      ` : ''}
      <p>You can now log in and start using the platform.</p>
      <br/>
      <p style="color:#888;font-size:12px">If you did not register, please ignore this email.</p>
    `
  });
};

/**
 * @desc  Email change security notification
 */
exports.sendEmailChangeMail = (to, name) => {
  return sendMail({
    to,
    subject: '🔐 Your email address has been changed — MacclouSpine',
    html: `
      <h2>Email Updated, ${name}</h2>
      <p>Your registered email on <strong>MacclouSpine</strong> has just been changed.</p>
      <p>If you did this, no action is needed. If you did <strong>not</strong> make this change, please contact support immediately.</p>
      <br/>
      <p style="color:#888;font-size:12px">This is an automated security notification.</p>
    `
  });
};

/**
 * @desc  Verification document submitted
 * @param {string} docType  e.g. 'PAN Card', 'Aadhar Card', 'Enrollment Certificate'
 */
exports.sendVerificationSubmittedMail = (to, name, docType) => {
  return sendMail({
    to,
    subject: `📄 ${docType} Submitted for Verification — MacclouSpine`,
    html: `
      <h2>Document Received, ${name}!</h2>
      <p>We have received your <strong>${docType}</strong> for verification.</p>
      <p>Our team will review it and notify you once the verification is complete.</p>
      <br/>
      <p style="color:#888;font-size:12px">MacclouSpine Verification Team</p>
    `
  });
};

/**
 * @desc  KYC / Verification status update (approved or rejected) — triggered by Admin
 * @param {string} status  'Verified' | 'Rejected'
 */
exports.sendVerificationStatusMail = (to, name, docType, status, reason = null) => {
  const isApproved = status === 'Verified';
  return sendMail({
    to,
    subject: `${isApproved ? '✅' : '❌'} ${docType} Verification ${isApproved ? 'Approved' : 'Rejected'} — MacclouSpine`,
    html: `
      <h2>Hello ${name},</h2>
      <p>Your <strong>${docType}</strong> verification has been <strong>${isApproved ? 'approved ✅' : 'rejected ❌'}</strong>.</p>
      ${!isApproved && reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
      ${!isApproved ? `<p>Please re-upload the correct document to complete your verification.</p>` : '<p>Your account is now verified. Thank you!</p>'}
      <br/>
      <p style="color:#888;font-size:12px">WebSpine Verification Team</p>
    `
  });
};

/**
 * @desc  Client receives booking confirmation after requesting a slot
 */
exports.sendBookingConfirmationMail = (to, clientName, slotDate, startTime, endTime, advName) => {
  return sendMail({
    to,
    subject: '📅 Booking Request Sent — MacclouSpine',
    html: `
      <h2>Booking Request Sent, ${clientName}!</h2>
      <p>Your appointment request has been sent to <strong>Advocate ${advName}</strong>.</p>
      <table style="border-collapse:collapse;margin-top:12px">
        <tr><td style="padding:4px 12px 4px 0"><strong>Date:</strong></td><td>${new Date(slotDate).toDateString()}</td></tr>
        <tr><td style="padding:4px 12px 4px 0"><strong>Time:</strong></td><td>${startTime} – ${endTime}</td></tr>
      </table>
      <p style="margin-top:16px">You will receive a confirmation once the advocate responds.</p>
      <br/>
      <p style="color:#888;font-size:12px">MacclouSpine Appointment System</p>
    `
  });
};

/**
 * @desc  Advocate is notified of a new booking request from a client
 */
exports.sendNewBookingRequestMail = (to, advName, clientName, slotDate, startTime, endTime) => {
  return sendMail({
    to,
    subject: '🔔 New Appointment Request — MacclouSpine',
    html: `
      <h2>New Booking Request, ${advName}!</h2>
      <p><strong>${clientName}</strong> has requested an appointment with you.</p>
      <table style="border-collapse:collapse;margin-top:12px">
        <tr><td style="padding:4px 12px 4px 0"><strong>Date:</strong></td><td>${new Date(slotDate).toDateString()}</td></tr>
        <tr><td style="padding:4px 12px 4px 0"><strong>Time:</strong></td><td>${startTime} – ${endTime}</td></tr>
      </table>
      <p style="margin-top:16px">Please log in to accept or reject this request.</p>
      <br/>
      <p style="color:#888;font-size:12px">MacclouSpine Appointment System</p>
    `
  });
};

/**
 * @desc  Client is notified when advocate accepts or rejects booking
 * @param {string} action  'accepted' | 'rejected'
 */
exports.sendBookingResponseMail = (to, clientName, action, slotDate, startTime, endTime, reason = null) => {
  const isAccepted = action === 'accepted';
  return sendMail({
    to,
    subject: `${isAccepted ? '✅' : '❌'} Appointment ${isAccepted ? 'Confirmed' : 'Rejected'} — MacclouSpine`,
    html: `
      <h2>Hello ${clientName},</h2>
      <p>Your appointment request has been <strong>${isAccepted ? 'accepted ✅' : 'rejected ❌'}</strong>.</p>
      <table style="border-collapse:collapse;margin-top:12px">
        <tr><td style="padding:4px 12px 4px 0"><strong>Date:</strong></td><td>${new Date(slotDate).toDateString()}</td></tr>
        <tr><td style="padding:4px 12px 4px 0"><strong>Time:</strong></td><td>${startTime} – ${endTime}</td></tr>
      </table>
      ${!isAccepted && reason ? `<p style="margin-top:12px"><strong>Reason:</strong> ${reason}</p>` : ''}
      ${isAccepted ? `<p style="margin-top:12px">Meeting details will be shared with you shortly by the advocate.</p>` : ''}
      <br/>
      <p style="color:#888;font-size:12px">MacclouSpine Appointment System</p>
    `
  });
};

/**
 * @desc  Client receives meeting link/address after advocate schedules
 * @param {string} meetingType  'online' | 'in-person'
 */
exports.sendMeetingScheduledMail = (to, clientName, meetingType, slotDate, startTime, endTime, meetingLink = null, meetingAddress = null) => {
  return sendMail({
    to,
    subject: '📍 Meeting Details Shared — MacclouSpine',
    html: `
      <h2>Meeting Details, ${clientName}!</h2>
      <p>Your advocate has shared the meeting details for your upcoming appointment.</p>
      <table style="border-collapse:collapse;margin-top:12px">
        <tr><td style="padding:4px 12px 4px 0"><strong>Date:</strong></td><td>${new Date(slotDate).toDateString()}</td></tr>
        <tr><td style="padding:4px 12px 4px 0"><strong>Time:</strong></td><td>${startTime} – ${endTime}</td></tr>
        <tr><td style="padding:4px 12px 4px 0"><strong>Type:</strong></td><td>${meetingType === 'online' ? '🌐 Online' : '🏛 In-Person'}</td></tr>
        ${meetingLink ? `<tr><td style="padding:4px 12px 4px 0"><strong>Link:</strong></td><td><a href="${meetingLink}">${meetingLink}</a></td></tr>` : ''}
        ${meetingAddress ? `<tr><td style="padding:4px 12px 4px 0"><strong>Address:</strong></td><td>${meetingAddress}</td></tr>` : ''}
      </table>
      <br/>
      <p style="color:#888;font-size:12px">MacclouSpine Appointment System</p>
    `
  });
};

/**
 * @desc  Admin OTP login email
 * @param {string} otp  Plain-text OTP (only time it exists unencrypted — sent immediately)
 */
exports.sendOtpMail = (to, name, otp) => {
  return sendMail({
    to,
    subject: '🔑 Your MacclouSpine Admin Login OTP',
    html: `
      <h2>Hello, ${name}!</h2>
      <p>Your One-Time Password (OTP) for MacclouSpine Admin login is:</p>
      <div style="margin:20px 0;text-align:center">
        <span style="font-size:36px;font-weight:bold;letter-spacing:10px;font-family:monospace;color:#1a1a2e;background:#f0f4ff;padding:12px 24px;border-radius:8px;display:inline-block">${otp}</span>
      </div>
      <p style="color:#e74c3c"><strong>⚠️ This OTP is valid for 10 minutes only and can be used once.</strong></p>
      <p>If you did not request this OTP, please ignore this email and contact your system administrator immediately.</p>
      <br/>
      <p style="color:#888;font-size:12px">MacclouSpine Admin Security System</p>
    `
  });
};

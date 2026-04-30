const Admin = require('../../models/Admin');
const AdminCounter = require('../../models/AdminCounter');
const Blacklist = require('../../models/Blacklist');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { sendWelcomeMail, sendOtpMail } = require('../../utils/mailer');

// ---------------------------------------------------------------------------
// HELPER: Generate JWT for admin
// ---------------------------------------------------------------------------
const generateToken = (id) =>
  jwt.sign({ id, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '30d' });

// ---------------------------------------------------------------------------
// HELPER: Generate sequential ADM ID — ADM000001, ADM000002, ...
// ---------------------------------------------------------------------------
const generateAdmId = async () => {
  const counter = await AdminCounter.findByIdAndUpdate(
    'adminCounter',
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return `ADM${counter.seq.toString().padStart(6, '0')}`;
};

// ---------------------------------------------------------------------------
// HELPER: Generate a 6-digit numeric OTP
// ---------------------------------------------------------------------------
const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

// ---------------------------------------------------------------------------
// @desc    Admin Signup
// @route   POST /api/admin/signup
// @body    { name, email, phone, panNumber, address, password, signupSecret }
// ---------------------------------------------------------------------------
exports.signUp = async (req, res) => {
  try {
    const { name, email, phone, panNumber, address, password, signupSecret } = req.body;

    // Guard: validate signup secret
    if (!signupSecret || signupSecret !== process.env.ADMIN_SIGNUP_SECRET) {
      return res.status(403).json({ success: false, message: 'Invalid signup authorization key' });
    }

    // Validate required fields
    if (!name || !email || !phone || !panNumber || !address || !password) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    // Check uniqueness
    const existing = await Admin.findOne({
      $or: [{ email: email.toLowerCase() }, { phone }, { panNumber: panNumber.toUpperCase() }]
    });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email, phone, or PAN already registered' });
    }

    const admId = await generateAdmId();

    const admin = await Admin.create({
      admId,
      name,
      email: email.toLowerCase(),
      phone,
      panNumber: panNumber.toUpperCase(),
      address,
      password
    });

    // Welcome email with ADM ID
    sendWelcomeMail(admin.email, admin.name, 'admin', admin.admId);

    res.status(201).json({
      success: true,
      message: 'Admin account created successfully',
      data: {
        admId: admin.admId,
        name: admin.name,
        email: admin.email
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------------------------------------------------------------------
// @desc    Login — ADM ID + Password
// @route   POST /api/admin/login
// @body    { admId, password }
// ---------------------------------------------------------------------------
exports.loginPassword = async (req, res) => {
  try {
    const { admId, password } = req.body;

    if (!admId || !password) {
      return res.status(400).json({ success: false, message: 'ADM ID and password are required' });
    }

    const admin = await Admin.findOne({ admId: admId.toUpperCase(), isActive: true }).select('+password');
    if (!admin || !(await admin.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid ADM ID or password' });
    }

    res.status(200).json({
      success: true,
      token: generateToken(admin._id),
      data: { admId: admin.admId, name: admin.name, email: admin.email }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------------------------------------------------------------------
// @desc    Request OTP (step 1 of OTP login)
// @route   POST /api/admin/request-otp
// @body    { admId }
// ---------------------------------------------------------------------------
exports.requestOtp = async (req, res) => {
  try {
    const { admId } = req.body;

    if (!admId) {
      return res.status(400).json({ success: false, message: 'ADM ID is required' });
    }

    const admin = await Admin.findOne({ admId: admId.toUpperCase(), isActive: true });
    if (!admin) {
      // Intentionally vague — do not confirm whether ADM ID exists
      return res.status(200).json({ success: true, message: 'If this ADM ID is registered, an OTP has been sent to the associated email.' });
    }

    // Generate OTP
    const otp = generateOtp();
    const otpHash = await bcrypt.hash(otp, 10);

    // Store hashed OTP + expiry (10 minutes)
    admin.otpHash = otpHash;
    admin.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await admin.save();

    // Send OTP email (fire-and-forget)
    sendOtpMail(admin.email, admin.name, otp);

    res.status(200).json({
      success: true,
      message: 'If this ADM ID is registered, an OTP has been sent to the associated email.'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------------------------------------------------------------------
// @desc    Login with OTP (step 2 of OTP login)
// @route   POST /api/admin/login-otp
// @body    { admId, otp }
// ---------------------------------------------------------------------------
exports.loginOtp = async (req, res) => {
  try {
    const { admId, otp } = req.body;

    if (!admId || !otp) {
      return res.status(400).json({ success: false, message: 'ADM ID and OTP are required' });
    }

    const admin = await Admin.findOne({ admId: admId.toUpperCase(), isActive: true }).select('+otpHash');
    if (!admin || !admin.otpHash) {
      return res.status(401).json({ success: false, message: 'Invalid or expired OTP' });
    }

    // Check expiry
    if (admin.otpExpiry < new Date()) {
      admin.otpHash = null;
      admin.otpExpiry = null;
      await admin.save();
      return res.status(401).json({ success: false, message: 'OTP has expired. Please request a new one.' });
    }

    // Compare OTP
    const isMatch = await bcrypt.compare(otp, admin.otpHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid or expired OTP' });
    }

    // Clear OTP — single use only
    admin.otpHash = null;
    admin.otpExpiry = null;
    await admin.save();

    res.status(200).json({
      success: true,
      token: generateToken(admin._id),
      data: { admId: admin.admId, name: admin.name, email: admin.email }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------------------------------------------------------------------
// @desc    Get Admin Profile
// @route   GET /api/admin/profile
// @access  Protected (admin JWT)
// ---------------------------------------------------------------------------
exports.getProfile = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin.id);
    if (!admin) return res.status(404).json({ success: false, message: 'Admin not found' });

    res.status(200).json({
      success: true,
      data: {
        admId: admin.admId,
        name: admin.name,
        email: admin.email,
        phone: admin.phone,
        panNumber: admin.panNumber,
        address: admin.address,
        isActive: admin.isActive,
        createdAt: admin.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------------------------------------------------------------------
// @desc    Logout Admin (blacklist current token)
// @route   POST /api/admin/logout
// @access  Protected
// ---------------------------------------------------------------------------
exports.logout = async (req, res) => {
  try {
    const token = req.headers.authorization.split(' ')[1];
    await Blacklist.create({ token });
    res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Logout failed' });
  }
};

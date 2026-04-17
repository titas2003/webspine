const User = require('../../models/User');
const jwt = require('jsonwebtoken');

/**
 * @desc    Helper: Generate Unique 7-digit Alphanumeric Client ID
 */
const generateClientId = () => {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < 7; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * @desc    Helper: Generate JWT Token
 */
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// ---------------------------------------------------------
// @desc    SignUp Client (Single ID Input)
// @route   POST /api/client/signup
// ---------------------------------------------------------
exports.signUp = async (req, res) => {
  try {
    const { name, phone, email, govId, password, location, photo } = req.body;

    // 1. Identify govId (PAN or Aadhar)
    if (!govId) {
      return res.status(400).json({ success: false, message: 'PAN or Aadhar is required' });
    }

    let panNumber = undefined;
    let aadharNumber = undefined;
    const cleanId = govId.trim().toUpperCase();

    if (cleanId.length === 12 && /^\d+$/.test(cleanId)) {
      aadharNumber = cleanId;
    } else if (cleanId.length === 10) {
      panNumber = cleanId;
    } else {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid ID format. Enter 12-digit Aadhar or 10-character PAN.' 
      });
    }

    // 2. Comprehensive Duplicate Check
    const checkFields = [
      { email: email.toLowerCase().trim() },
      { phone: phone.trim() }
    ];
    if (panNumber) checkFields.push({ panNumber });
    if (aadharNumber) checkFields.push({ aadharNumber });

    const userExists = await User.findOne({ $or: checkFields });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'Registration failed: Email, Phone, or Identity ID already in use.',
      });
    }

    // 3. Unique Client ID Generation
    let clientId;
    let isUnique = false;
    while (!isUnique) {
      clientId = generateClientId();
      const existingId = await User.findOne({ clientId });
      if (!existingId) isUnique = true;
    }

    // 4. Creation with new fields
    const user = await User.create({
      clientId,
      name,
      phone,
      email,
      panNumber,
      aadharNumber,
      password,
      location, // Supports lat/long/address from GPS
      photo,
      vStatus: 'Pending' // Defaulting to Pending
    });

    res.status(201).json({
      success: true,
      token: generateToken(user._id),
      data: {
        id: user._id,
        clientId: user.clientId,
        name: user.name,
        vStatus: user.vStatus
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Signup Error: ' + error.message });
  }
};

// ---------------------------------------------------------
// @desc    Login Client
// @route   POST /api/client/login
// ---------------------------------------------------------
exports.login = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ success: false, message: 'Credentials missing' });
    }

    const user = await User.findOne({
      $or: [
        { email: identifier.toLowerCase().trim() },
        { clientId: identifier.toUpperCase().trim() },
        { panNumber: identifier.toUpperCase().trim() },
        { aadharNumber: identifier.trim() },
      ],
    }).select('+password');

    if (user && (await user.matchPassword(password))) {
      res.status(200).json({
        success: true,
        token: generateToken(user._id),
        data: {
          clientId: user.clientId,
          name: user.name,
          vStatus: user.vStatus
        }
      });
    } else {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Login Error' });
  }
};

// ---------------------------------------------------------
// @desc    Get Current Profile
// @route   GET /api/client/profile
// ---------------------------------------------------------
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------------------------------------------------
// @desc    Update Profile Details
// @route   PUT /api/client/profile
// ---------------------------------------------------------
exports.updateProfile = async (req, res) => {
  try {
    const updates = req.body;

    // SECURITY: Blacklist fields that should NOT be updated via this route
    const restricted = ['password', 'vStatus', 'clientId', 'panNumber', 'aadharNumber', 'email'];
    restricted.forEach(field => delete updates[field]);

    const user = await User.findByIdAndUpdate(req.user.id, updates, {
      new: true,
      runValidators: true
    });

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------------------------------------------------
// @desc    Update GPS Location
// @route   PATCH /api/client/location
// ---------------------------------------------------------
exports.updateLocation = async (req, res) => {
  try {
    const { latitude, longitude, address } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.user.id, 
      { location: { latitude, longitude, address } },
      { new: true }
    );

    res.status(200).json({ success: true, message: 'GPS Location updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------------------------------------------------
// @desc    Verification Status Check
// @route   GET /api/client/verification-status
// ---------------------------------------------------------
exports.getVerificationStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('vStatus');
    res.status(200).json({ success: true, vStatus: user.vStatus });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------------------------------------------------
// @desc    Logout
// @route   POST /api/client/logout
// ---------------------------------------------------------
const Blacklist = require('../../models/Blacklist');

exports.logout = async (req, res) => {
  try {
    const token = req.headers.authorization.split(' ')[1];
    await Blacklist.create({ token }); // Add token to "burned" list
    res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------------------------------------------------
// @desc    Update Client Email & Invalidate Session
// @route   PATCH /api/client/update-email
// ---------------------------------------------------------
exports.updateEmail = async (req, res) => {
  try {
    const { email } = req.body;
    // Extract the token to blacklist it
    const token = req.headers.authorization.split(' ')[1];

    if (!email) {
      return res.status(400).json({ success: false, message: 'Please provide a new email' });
    }

    const cleanEmail = email.toLowerCase().trim();

    // 1. Check if email is already in use
    const emailExists = await User.findOne({ email: cleanEmail });
    if (emailExists) {
      return res.status(400).json({ success: false, message: 'Email is already registered to another account' });
    }

    // 2. Update the email
    await User.findByIdAndUpdate(
      req.user.id,
      { email: cleanEmail },
      { new: true, runValidators: true }
    );

    // 3. SECURITY: Blacklist the token so the user must re-login with the new email
    await Blacklist.create({ token });

    res.status(200).json({
      success: true,
      message: 'Email updated successfully. Please login again with your new email.'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------------------------------------------------
// @desc    Update Client Phone & Invalidate Session
// @route   PATCH /api/client/update-phone
// ---------------------------------------------------------
exports.updatePhone = async (req, res) => {
  try {
    const { phone } = req.body;
    // Extract the token to blacklist it
    const token = req.headers.authorization.split(' ')[1];

    if (!phone) {
      return res.status(400).json({ success: false, message: 'Please provide a new phone number' });
    }

    const cleanPhone = phone.trim();

    // 1. Check if phone is already in use
    const phoneExists = await User.findOne({ phone: cleanPhone });
    if (phoneExists) {
      return res.status(400).json({ success: false, message: 'Phone number is already registered to another account' });
    }

    // 2. Update the phone
    await User.findByIdAndUpdate(
      req.user.id,
      { phone: cleanPhone },
      { new: true, runValidators: true }
    );

    // 3. SECURITY: Blacklist the token so the user must re-login with the new phone
    await Blacklist.create({ token });

    res.status(200).json({
      success: true,
      message: 'Phone number updated successfully. Please login again with your new phone number.'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
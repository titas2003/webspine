const User = require('../models/User');
const jwt = require('jsonwebtoken');

/**
 * Helper: Generate Unique 7-digit Alphanumeric Client ID
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
 * Helper: Generate JWT Token
 */
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// ---------------------------------------------------------
// @desc    Register a new Client (Single ID Input)
// @route   POST /api/user/register
// ---------------------------------------------------------
exports.register = async (req, res) => {
  try {
    const { name, phone, email, govId, password } = req.body;

    // 1. Identify if govId is PAN or AADHAR
    if (!govId) {
      return res.status(400).json({ success: false, message: 'Please provide PAN or Aadhar number' });
    }

    let panNumber = undefined;
    let aadharNumber = undefined;
    const cleanId = govId.trim().toUpperCase();

    // Logic: 12 digits = Aadhar | 10 chars = PAN
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

    // 2. Check if user already exists (Email, Phone, or the specific ID provided)
    const checkFields = [
      { email: email.toLowerCase() },
      { phone }
    ];
    if (panNumber) checkFields.push({ panNumber });
    if (aadharNumber) checkFields.push({ aadharNumber });

    const userExists = await User.findOne({ $or: checkFields });

    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'A client with these details already exists.',
      });
    }

    // 3. Generate a truly unique 7-digit Client ID
    let clientId;
    let isUnique = false;
    while (!isUnique) {
      clientId = generateClientId();
      const existingId = await User.findOne({ clientId });
      if (!existingId) isUnique = true;
    }

    // 4. Create the Client
    const user = await User.create({
      clientId,
      name,
      phone,
      email,
      panNumber,
      aadharNumber,
      password,
    });

    res.status(201).json({
      success: true,
      token: generateToken(user._id),
      user: {
        id: user._id,
        clientId: user.clientId,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ---------------------------------------------------------
// @desc    Login Client (Auto-identifies by Email, ClientID, PAN, or Aadhar)
// @route   POST /api/user/login
// ---------------------------------------------------------
exports.login = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ success: false, message: 'Please provide credentials' });
    }

    // Identify and search across all 4 unique identification fields
    const user = await User.findOne({
      $or: [
        { email: identifier.toLowerCase() },
        { clientId: identifier.toUpperCase() },
        { panNumber: identifier.toUpperCase() },
        { aadharNumber: identifier }, // Aadhar remains numeric
      ],
    }).select('+password');

    if (user && (await user.matchPassword(password))) {
      res.status(200).json({
        success: true,
        token: generateToken(user._id),
        user: {
          id: user._id,
          clientId: user.clientId,
          name: user.name,
        },
      });
    } else {
      res.status(401).json({ success: false, message: 'Invalid login credentials' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error: ' + error.message });
  }
};

// ---------------------------------------------------------
// @desc    Get Current Logged-in Client Profile
// @route   GET /api/user/me
// ---------------------------------------------------------
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
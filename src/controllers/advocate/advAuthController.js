const Advocate = require('../../models/Advocates');
const AdvocateCounter = require('../../models/AdvocateCounter');
const Blacklist = require('../../models/Blacklist');
const jwt = require('jsonwebtoken');

/**
 * HELPER: Generate Unique 7-Digit AdvID
 * Logic: [2-Letter State][1-Letter Sequence][4-Digit Number]
 */
const generateAdvId = async (stateName) => {
  // 1. Get State Abbreviation (e.g., "West Bengal" -> "WB", "Punjab" -> "PU")
  const parts = stateName.trim().split(/\s+/);
  let stateCode = "";

  if (parts.length > 1) {
    // Take first letter of first two words
    stateCode = (parts[0][0] + parts[1][0]).toUpperCase();
  } else {
    // Take first two letters of the single word
    stateCode = stateName.substring(0, 2).toUpperCase();
  }

  // 2. Find or Create Counter for this state
  let counter = await AdvocateCounter.findOne({ stateCode });
  if (!counter) {
    counter = await AdvocateCounter.create({ stateCode, currentLetter: 'A', count: 0 });
  }

  // 3. Increment count and handle sequence letter rollover
  counter.count += 1;
  if (counter.count > 9999) {
    counter.count = 1;
    // Increment the 3rd character: A -> B, B -> C
    const nextCharCode = counter.currentLetter.charCodeAt(0) + 1;
    counter.currentLetter = String.fromCharCode(nextCharCode);
  }
  await counter.save();

  // 4. Pad number with leading zeros (e.g., 5 -> 0005)
  const paddedCount = counter.count.toString().padStart(4, '0');

  // Final ID: WB + A + 0001 = WBA0001
  return `${stateCode}${counter.currentLetter}${paddedCount}`;
};

/**
 * @desc    Register a new Advocate
 * @route   POST /api/advocate/signup
 */
exports.signUp = async (req, res) => {
  try {
    const { name, email, phone, state, password } = req.body;
    // Check if body fields are present
    if (!name || !email || !phone || !state || !password) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    // Check for existing users
    try {
      const exists = await Advocate.findOne({ $or: [{ email }, { phone }] });
      if (exists) {
        return res.status(400).json({ success: false, message: 'Email or Phone already registered' });
      }
    } catch (err) {
      console.error('Error checking existing advocate:', err);
      return res.status(500).json({ success: false, message: 'Database error during registration' });
    }

    // Generate unique AdvID
    const advId = await generateAdvId(state);
    // Create Advocate
    let advocate;
    try {
      advocate = await Advocate.create({
        advId,
        name,
        email,
        phone,
        state,
        password
      });
      console.log('Created Advocate:', advocate);
    } catch (error) {
      console.error('Error creating advocate:', error);
      return res.status(500).json({ success: false, message: 'Database error during registration' });
    }
    // Generate Token
    const token = jwt.sign({ id: advocate._id }, process.env.JWT_SECRET, { expiresIn: '30d' });
    console.log('Generated JWT Token:', token); // Debug log

    res.status(201).json({
      success: true,
      token,
      data: {
        advId: advocate.advId,
        name: advocate.name,
        email: advocate.email
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Internal Server Error'
    });
  }
};

/**
 * @desc    Login Advocate (via Email or AdvID)
 * @route   POST /api/advocate/login
 */
exports.login = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ success: false, message: 'Please provide credentials' });
    }

    // Find advocate by Email or AdvID
    const advocate = await Advocate.findOne({
      $or: [
        { email: identifier.toLowerCase() },
        { advId: identifier.toUpperCase() }
      ]
    }).select('+password');
    if (advocate && (await advocate.matchPassword(password))) {
      const token = jwt.sign({ id: advocate._id }, process.env.JWT_SECRET, { expiresIn: '30d' });

      res.status(200).json({
        success: true,
        token,
        data: {
          advId: advocate.advId,
          name: advocate.name
        }
      });
    } else {
      res.status(401).json({ success: false, message: 'Invalid email/ID or password' });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Internal Server Error'
    });
  }
};

exports.logout = async (req, res) => {
  console.log('Logout request received');
  try {
    // 1. Get the token from the headers
    const token = req.headers.authorization.split(' ')[1];
    console.log('Token to blacklist:', token); // Debug log
    // 2. Add to Blacklist

    await Blacklist.create({ token });
    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Logout failed',
      error: error.message
    });
  }
};

/**
 * @desc    Get Advocate Profile
 * @route   GET /api/advocate/profile
 * @access  Protected
 */
exports.getProfile = async (req, res) => {
  try {
    const advocate = await Advocate.findById(req.user.id);

    if (!advocate) {
      return res.status(404).json({ success: false, message: 'Advocate not found' });
    }

    res.status(200).json({
      success: true,
      data: {
        advId: advocate.advId,
        name: advocate.name,
        email: advocate.email,
        phone: advocate.phone,
        state: advocate.state,
        vStatus: advocate.vStatus,
        createdAt: advocate.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Internal Server Error' });
  }
};
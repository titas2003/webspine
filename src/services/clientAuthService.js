const User = require('../models/User');
const Blacklist = require('../models/Blacklist');
const jwt = require('jsonwebtoken');
const { sendWelcomeMail, sendEmailChangeMail } = require('../utils/mailer');

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

class ClientAuthService {
  /**
   * Register a new client
   */
  static async signUpClient(data) {
    const { name, phone, email, govId, password, location, photo } = data;

    if (!govId) {
      throw new Error('PAN or Aadhar is required');
    }

    let panNumber = undefined;
    let aadharNumber = undefined;
    const cleanId = govId.trim().toUpperCase();

    if (cleanId.length === 12 && /^\d+$/.test(cleanId)) {
      aadharNumber = cleanId;
    } else if (cleanId.length === 10) {
      panNumber = cleanId;
    } else {
      throw new Error('Invalid ID format. Enter 12-digit Aadhar or 10-character PAN.');
    }

    const checkFields = [
      { email: email.toLowerCase().trim() },
      { phone: phone.trim() }
    ];
    if (panNumber) checkFields.push({ panNumber });
    if (aadharNumber) checkFields.push({ aadharNumber });

    const userExists = await User.findOne({ $or: checkFields });
    if (userExists) {
      throw new Error('Registration failed: Email, Phone, or Identity ID already in use.');
    }

    let clientId;
    let isUnique = false;
    while (!isUnique) {
      clientId = generateClientId();
      const existingId = await User.findOne({ clientId });
      if (!existingId) isUnique = true;
    }

    const user = await User.create({
      clientId,
      name,
      phone,
      email,
      panNumber,
      aadharNumber,
      password,
      location,
      photo,
      vStatus: 'Pending'
    });

    // Fire-and-forget welcome email
    sendWelcomeMail(user.email, user.name, 'user', user.clientId);

    return {
      token: generateToken(user._id),
      user: {
        id: user._id,
        clientId: user.clientId,
        name: user.name,
        vStatus: user.vStatus
      }
    };
  }

  /**
   * Login an existing client
   */
  static async loginClient(identifier, password) {
    if (!identifier || !password) {
      throw new Error('Credentials missing');
    }

    const user = await User.findOne({
      $or: [
        { email: identifier.toLowerCase().trim() },
        { clientId: identifier.toUpperCase().trim() },
        { panNumber: identifier.toUpperCase().trim() },
        { aadharNumber: identifier.trim() },
      ],
    }).select('+password');

    if (!user || !(await user.matchPassword(password))) {
      throw new Error('Invalid credentials');
    }

    return {
      token: generateToken(user._id),
      user: {
        clientId: user.clientId,
        name: user.name,
        vStatus: user.vStatus
      }
    };
  }

  /**
   * Get client profile
   */
  static async getProfile(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  /**
   * Update client profile
   */
  static async updateProfile(userId, updates) {
    const restricted = ['password', 'vStatus', 'clientId', 'panNumber', 'aadharNumber', 'email'];
    restricted.forEach(field => delete updates[field]);

    const user = await User.findByIdAndUpdate(userId, updates, {
      new: true,
      runValidators: true
    });

    if (!user) throw new Error('User not found');
    return user;
  }

  /**
   * Update client GPS location
   */
  static async updateLocation(userId, latitude, longitude, address) {
    const user = await User.findByIdAndUpdate(
      userId, 
      { location: { latitude, longitude, address } },
      { new: true }
    );
    if (!user) throw new Error('User not found');
    return user;
  }

  /**
   * Get client verification status
   */
  static async getVerificationStatus(userId) {
    const user = await User.findById(userId).select('vStatus');
    if (!user) throw new Error('User not found');
    return user.vStatus;
  }

  /**
   * Logout client (blacklist token)
   */
  static async logoutClient(token) {
    if (!token) throw new Error('Token missing');
    await Blacklist.create({ token });
    return true;
  }

  /**
   * Update client email
   */
  static async updateEmail(userId, email, token) {
    if (!email) throw new Error('Please provide a new email');
    
    const cleanEmail = email.toLowerCase().trim();
    const emailExists = await User.findOne({ email: cleanEmail });
    if (emailExists) {
      throw new Error('Email is already registered to another account');
    }

    await User.findByIdAndUpdate(
      userId,
      { email: cleanEmail },
      { new: true, runValidators: true }
    );

    // Blacklist current session
    if (token) await Blacklist.create({ token });

    // Security notification to old email
    sendEmailChangeMail(cleanEmail, (await User.findById(userId).select('name'))?.name || 'User');
    return true;
  }

  /**
   * Update client phone
   */
  static async updatePhone(userId, phone, token) {
    if (!phone) throw new Error('Please provide a new phone number');
    
    const cleanPhone = phone.trim();
    const phoneExists = await User.findOne({ phone: cleanPhone });
    if (phoneExists) {
      throw new Error('Phone number is already registered to another account');
    }

    await User.findByIdAndUpdate(
      userId,
      { phone: cleanPhone },
      { new: true, runValidators: true }
    );

    // Blacklist current session
    if (token) await Blacklist.create({ token });
    return true;
  }
}

module.exports = ClientAuthService;

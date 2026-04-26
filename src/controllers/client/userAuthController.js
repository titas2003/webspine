const ClientAuthService = require('../../services/clientAuthService');

// ---------------------------------------------------------
// @desc    SignUp Client (Single ID Input)
// @route   POST /api/client/signup
// ---------------------------------------------------------
exports.signUp = async (req, res) => {
  try {
    const result = await ClientAuthService.signUpClient(req.body);
    res.status(201).json({
      success: true,
      ...result // Spreads token and data/user
    });
  } catch (error) {
    const statusCode = error.message.includes('required') || error.message.includes('Invalid') || error.message.includes('failed') ? 400 : 500;
    res.status(statusCode).json({ success: false, message: 'Signup Error: ' + error.message });
  }
};

// ---------------------------------------------------------
// @desc    Login Client
// @route   POST /api/client/login
// ---------------------------------------------------------
exports.login = async (req, res) => {
  try {
    const { identifier, password } = req.body;
    const result = await ClientAuthService.loginClient(identifier, password);
    res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    const statusCode = error.message === 'Invalid credentials' || error.message === 'Credentials missing' ? 401 : 500;
    res.status(statusCode).json({ success: false, message: error.message });
  }
};

// ---------------------------------------------------------
// @desc    Get Current Profile
// @route   GET /api/client/profile
// ---------------------------------------------------------
exports.getProfile = async (req, res) => {
  try {
    const user = await ClientAuthService.getProfile(req.user.id);
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    const statusCode = error.message === 'User not found' ? 404 : 500;
    res.status(statusCode).json({ success: false, message: error.message });
  }
};

// ---------------------------------------------------------
// @desc    Update Profile Details
// @route   PUT /api/client/profile
// ---------------------------------------------------------
exports.updateProfile = async (req, res) => {
  try {
    const user = await ClientAuthService.updateProfile(req.user.id, req.body);
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
    await ClientAuthService.updateLocation(req.user.id, latitude, longitude, address);
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
    const vStatus = await ClientAuthService.getVerificationStatus(req.user.id);
    res.status(200).json({ success: true, vStatus });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------------------------------------------------
// @desc    Logout
// @route   POST /api/client/logout
// ---------------------------------------------------------
exports.logout = async (req, res) => {
  try {
    const token = req.headers.authorization.split(' ')[1];
    await ClientAuthService.logoutClient(token);
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
    const token = req.headers.authorization.split(' ')[1];
    await ClientAuthService.updateEmail(req.user.id, email, token);
    res.status(200).json({
      success: true,
      message: 'Email updated successfully. Please login again with your new email.'
    });
  } catch (error) {
    const statusCode = error.message.includes('provide') || error.message.includes('registered') ? 400 : 500;
    res.status(statusCode).json({ success: false, message: error.message });
  }
};

// ---------------------------------------------------------
// @desc    Update Client Phone & Invalidate Session
// @route   PATCH /api/client/update-phone
// ---------------------------------------------------------
exports.updatePhone = async (req, res) => {
  try {
    const { phone } = req.body;
    const token = req.headers.authorization.split(' ')[1];
    await ClientAuthService.updatePhone(req.user.id, phone, token);
    res.status(200).json({
      success: true,
      message: 'Phone number updated successfully. Please login again with your new phone number.'
    });
  } catch (error) {
    const statusCode = error.message.includes('provide') || error.message.includes('registered') ? 400 : 500;
    res.status(statusCode).json({ success: false, message: error.message });
  }
};
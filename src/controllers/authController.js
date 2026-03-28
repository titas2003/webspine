const Advocate = require('../models/Advocates');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

exports.register = async (req, res) => {
  try {
    // 1. Extract ALL fields from the frontend request
    const { 
      fullName, 
      barId, 
      email, 
      password, 
      city, 
      area, 
      specialization, 
      experienceYears 
    } = req.body;
    
    const advocateExists = await Advocate.findOne({ email });
    if (advocateExists) return res.status(400).json({ message: 'Advocate already registered' });

    // 2. Pass the full object to the model
    const advocate = await Advocate.create({ 
      fullName, 
      barId, 
      email, 
      password,
      city,
      area,
      specialization,
      experienceYears
    });

    res.status(201).json({
      success: true,
      token: generateToken(advocate._id),
      user: {
        id: advocate._id,
        fullName: advocate.fullName,
        email: advocate.email,
        city: advocate.city,
        specialization: advocate.specialization
      }
    });
  } catch (error) {
    // Catch validation errors specifically
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Explicitly select password because it's hidden by default in the schema
    const advocate = await Advocate.findOne({ email }).select('+password');

    if (advocate && (await advocate.matchPassword(password))) {
      res.json({
        success: true,
        token: generateToken(advocate._id),
        user: {
          id: advocate._id,
          fullName: advocate.fullName,
          email: advocate.email
        }
      });
    } else {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.logout = async (req, res) => {
  try {
    // If you use cookies, you would add: res.clearCookie('token');
    res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
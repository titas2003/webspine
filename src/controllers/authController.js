const Advocate = require('../models/Advocates'); // Updated import
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

exports.register = async (req, res) => {
  try {
    const { fullName, barId, email, password } = req.body;
    
    const advocateExists = await Advocate.findOne({ email });
    if (advocateExists) return res.status(400).json({ message: 'Advocate already registered' });

    const advocate = await Advocate.create({ fullName, barId, email, password });

    res.status(201).json({
      success: true,
      token: generateToken(advocate._id),
      user: {
        id: advocate._id,
        fullName: advocate.fullName,
        email: advocate.email
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
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
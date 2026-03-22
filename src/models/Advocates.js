const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const advocateSchema = new mongoose.Schema({
  fullName: { 
    type: String, 
    required: [true, 'Please add a full name'],
    trim: true
  },
  barId: { 
    type: String, 
    required: [true, 'Bar Association ID is required'], 
    unique: true,
    trim: true
  },
  email: { 
    type: String, 
    required: [true, 'Please add an email'], 
    unique: true,
    lowercase: true,
    match: [/.+\@.+\..+/, 'Please fill a valid email address']
  },
  password: { 
    type: String, 
    required: [true, 'Please add a password'],
    minlength: 6,
    select: false 
  },
  
  // --- NEW LOCATION FIELDS ---
  city: { 
    type: String, 
    required: [true, 'City is required for client discovery'],
    index: true // Makes searching by city much faster
  },
  area: { 
    type: String, 
    required: [true, 'Specific area or locality is required'],
    trim: true
  },
  
  // --- PROFESSIONAL DETAILS ---
  specialization: { 
    type: String, 
    required: [true, 'Please specify your primary area of practice'],
    enum: ['Criminal', 'Civil', 'Corporate', 'Family', 'Tax', 'Intellectual Property', 'Other'],
    index: true 
  },
  experienceYears: {
    type: Number,
    default: 0
  },
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot be more than 500 characters']
  },
  profileImage: {
    type: String,
    default: 'https://i.imgur.com/8Km9tLL.png' // Default placeholder
  },

  role: { 
    type: String, 
    default: 'advocate' 
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
}, {
  timestamps: true // Automatically adds updatedAt and createdAt
});

// Encryption hook
advocateSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Password verification
advocateSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('Advocates', advocateSchema, 'advocates');
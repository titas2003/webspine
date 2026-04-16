const mongoose = require('mongoose');
const blacklistSchema = new mongoose.Schema({
  token: { type: String, required: true, index: true },
  createdAt: { type: Date, default: Date.now, expires: '30d' } // Auto-delete after token expiry
});
module.exports = mongoose.model('Blacklist', blacklistSchema);
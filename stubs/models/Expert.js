const mongoose = require('mongoose');
const crypto = require('crypto');

const expertSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true
  },
  token: {
    type: String,
    unique: true
  },
  qrCodeUrl: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Generate unique token before saving
expertSchema.pre('save', function(next) {
  if (!this.token) {
    this.token = crypto.randomBytes(16).toString('hex');
  }
  next();
});

module.exports = mongoose.model('Expert', expertSchema);


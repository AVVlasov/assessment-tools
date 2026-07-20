const mongoose = require('mongoose');
const crypto = require('crypto');

const hallSchema = new mongoose.Schema({
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  num: {
    type: Number,
    required: true
  },
  token: {
    type: String,
    required: true,
    unique: true,
    default: () => crypto.randomBytes(16).toString('hex')
  },
  status: {
    type: String,
    enum: ['live', 'break'],
    default: 'break'
  },
  currentSpeakerIndex: {
    type: Number,
    default: 0
  },
  qrNote: {
    type: String,
    default: 'сам переключается на текущего спикера'
  },
  order: {
    type: Number,
    default: 0
  },
  color: {
    type: String,
    default: '#4FC9F0'
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

hallSchema.index({ eventId: 1, num: 1 }, { unique: true });

if (mongoose.models.Hall) {
  delete mongoose.models.Hall;
  delete mongoose.connection.models.Hall;
}

module.exports = mongoose.model('Hall', hallSchema);

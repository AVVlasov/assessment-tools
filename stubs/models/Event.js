const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    default: 'Новое мероприятие'
  },
  description: {
    type: String,
    default: ''
  },
  eventDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  location: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['draft', 'ready', 'active', 'completed'],
    default: 'draft'
  },
  votingEnabled: {
    type: Boolean,
    default: false
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

module.exports = mongoose.model('Event', eventSchema);


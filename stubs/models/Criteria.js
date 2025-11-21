const mongoose = require('mongoose');

const criterionItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  maxScore: {
    type: Number,
    default: 5,
    min: 0,
    max: 10
  }
}, { _id: false });

const criteriaSchema = new mongoose.Schema({
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  blockName: {
    type: String,
    required: true
  },
  criteria: [criterionItemSchema],
  order: {
    type: Number,
    default: 0
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

module.exports = mongoose.model('Criteria', criteriaSchema);


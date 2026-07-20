const mongoose = require('mongoose');

const criterionOptionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  subtitle: {
    type: String,
    default: ''
  }
}, { _id: false });

const criterionItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  tag: {
    type: String,
    default: ''
  },
  hint: {
    type: String,
    default: ''
  },
  maxScore: {
    type: Number,
    default: 5,
    min: 0,
    max: 10
  },
  options: {
    type: [criterionOptionSchema],
    default: []
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
  criteriaType: {
    type: String,
    default: 'all',
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

if (mongoose.models.Criteria) {
  delete mongoose.models.Criteria;
  delete mongoose.connection.models.Criteria;
}

module.exports = mongoose.model('Criteria', criteriaSchema);


const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['team', 'participant'],
    required: true
  },
  name: {
    type: String,
    required: true
  },
  projectName: {
    type: String,
    default: ''
  },
  caseDescription: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  },
  votingStatus: {
    type: String,
    enum: ['not_evaluated', 'evaluating', 'evaluated'],
    default: 'not_evaluated'
  },
  isActiveForVoting: {
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

module.exports = mongoose.model('Team', teamSchema);


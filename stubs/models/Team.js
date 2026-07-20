const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  type: {
    type: String,
    enum: ['team', 'participant', 'speaker', 'event'],
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
  hallId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hall',
    default: null
  },
  scheduledTime: {
    type: String,
    default: ''
  },
  org: {
    type: String,
    default: ''
  },
  format: {
    type: String,
    enum: ['talk', 'panel', 'workshop'],
    default: 'talk'
  },
  order: {
    type: Number,
    default: 0
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
  programDone: {
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

if (mongoose.models.Team) {
  delete mongoose.models.Team;
  delete mongoose.connection.models.Team;
}

module.exports = mongoose.model('Team', teamSchema);


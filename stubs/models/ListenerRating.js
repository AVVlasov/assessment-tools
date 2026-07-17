const mongoose = require('mongoose');

const scoreItemSchema = new mongoose.Schema({
  criterionName: {
    type: String,
    required: true
  },
  tag: {
    type: String,
    default: ''
  },
  score: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  optionTitle: {
    type: String,
    default: ''
  }
}, { _id: false });

const listenerRatingSchema = new mongoose.Schema({
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  hallId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hall',
    default: null
  },
  teamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    default: null
  },
  targetType: {
    type: String,
    enum: ['speaker', 'panel', 'workshop', 'event'],
    required: true,
    default: 'speaker'
  },
  sessionId: {
    type: String,
    required: true
  },
  scores: [scoreItemSchema],
  reactions: [{
    type: String
  }],
  elapsedSeconds: {
    type: Number,
    default: 0
  },
  averageScore: {
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

listenerRatingSchema.pre('save', function(next) {
  if (this.scores && this.scores.length) {
    this.averageScore = this.scores.reduce((s, i) => s + i.score, 0) / this.scores.length;
  }
  next();
});

listenerRatingSchema.index(
  { sessionId: 1, teamId: 1, targetType: 1 },
  { unique: true, partialFilterExpression: { teamId: { $type: 'objectId' } } }
);
listenerRatingSchema.index(
  { sessionId: 1, eventId: 1, targetType: 1 },
  { unique: true, partialFilterExpression: { targetType: 'event' } }
);

if (mongoose.models.ListenerRating) {
  delete mongoose.models.ListenerRating;
  delete mongoose.connection.models.ListenerRating;
}

module.exports = mongoose.model('ListenerRating', listenerRatingSchema);

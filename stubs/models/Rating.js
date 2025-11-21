const mongoose = require('mongoose');

const ratingItemSchema = new mongoose.Schema({
  criteriaId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Criteria',
    required: true
  },
  criterionName: {
    type: String,
    required: true
  },
  score: {
    type: Number,
    required: true,
    min: 0,
    max: 5
  }
}, { _id: false });

const ratingSchema = new mongoose.Schema({
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  expertId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Expert',
    required: true
  },
  teamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: true
  },
  ratings: [ratingItemSchema],
  totalScore: {
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

// Calculate total score before saving
ratingSchema.pre('save', function(next) {
  this.totalScore = this.ratings.reduce((sum, item) => sum + item.score, 0);
  next();
});

// Ensure unique combination of expert and team
ratingSchema.index({ expertId: 1, teamId: 1 }, { unique: true });

module.exports = mongoose.model('Rating', ratingSchema);


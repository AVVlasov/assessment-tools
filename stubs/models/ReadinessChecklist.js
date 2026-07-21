const mongoose = require('mongoose');

const checklistItemSchema = new mongoose.Schema({
  text: {
    type: String,
    default: ''
  },
  done: {
    type: Boolean,
    default: false
  }
}, { _id: true });

const readinessChecklistSchema = new mongoose.Schema({
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  teamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    default: null
  },
  name: {
    type: String,
    default: 'Новый чеклист'
  },
  type: {
    type: String,
    enum: ['talk', 'panel', 'workshop'],
    default: 'talk'
  },
  widgets: {
    type: [{
      type: String,
      enum: ['rehearsal', 'calendar', 'deck', 'approval']
    }],
    default: ['rehearsal', 'calendar', 'deck', 'approval']
  },
  items: {
    type: [checklistItemSchema],
    default: []
  },
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

readinessChecklistSchema.index({ eventId: 1, order: 1 });
readinessChecklistSchema.index({ eventId: 1, type: 1 });

if (mongoose.models.ReadinessChecklist) {
  delete mongoose.models.ReadinessChecklist;
  delete mongoose.connection.models.ReadinessChecklist;
}

module.exports = mongoose.model('ReadinessChecklist', readinessChecklistSchema);

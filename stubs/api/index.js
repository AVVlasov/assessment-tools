const path = require('path');
const mongoose = require('mongoose');
const router = require('express').Router();
const connectDB = require('../config/database');

// Сброс кэша модулей stubs при hot-reload (нормализация путей для Windows)
Object.keys(require.cache).forEach((key) => {
  const normalized = key.replace(/\\/g, '/').toLowerCase();
  if (normalized.includes('/stubs/') && !normalized.includes('/stubs/api/index')) {
    delete require.cache[key];
  }
});

['Event', 'Team', 'Expert', 'Criteria', 'Rating', 'Hall', 'ListenerRating', 'ReadinessChecklist'].forEach((name) => {
  if (mongoose.models[name]) {
    delete mongoose.models[name];
  }
  if (mongoose.connection.models[name]) {
    delete mongoose.connection.models[name];
  }
});

connectDB();

const timer = (time = 300) => (req, res, next) => setTimeout(next, time);

router.use(timer());

router.use('/events', require('../routes/event'));
router.use('/teams', require('../routes/teams'));
router.use('/experts', require('../routes/experts'));
router.use('/criteria', require('../routes/criteria'));
router.use('/ratings', require('../routes/ratings'));
router.use('/halls', require('../routes/halls'));
router.use('/listener', require('../routes/listener'));
router.use('/checklists', require('../routes/checklists'));

module.exports = router;

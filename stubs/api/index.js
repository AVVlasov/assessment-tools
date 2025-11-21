const router = require('express').Router();
const connectDB = require('../config/database');

// Подключение к MongoDB
connectDB();

const timer = (time = 300) => (req, res, next) => setTimeout(next, time);

router.use(timer());

// Подключение маршрутов
router.use('/events', require('../routes/event'));
router.use('/teams', require('../routes/teams'));
router.use('/experts', require('../routes/experts'));
router.use('/criteria', require('../routes/criteria'));
router.use('/ratings', require('../routes/ratings'));

module.exports = router;

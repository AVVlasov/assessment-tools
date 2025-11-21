const router = require('express').Router();
const { Expert } = require('../models');

// GET /api/experts - список экспертов
router.get('/', async (req, res) => {
  try {
    const { eventId } = req.query;
    const filter = {};
    if (eventId) filter.eventId = eventId;
    const experts = await Expert.find(filter).sort({ createdAt: -1 });
    res.json(experts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/experts/by-token/:token - получить данные эксперта по токену
router.get('/by-token/:token', async (req, res) => {
  try {
    const expert = await Expert.findOne({ token: req.params.token });
    if (!expert) {
      return res.status(404).json({ error: 'Expert not found' });
    }
    res.json(expert);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/experts/:id - получить эксперта по ID
router.get('/:id', async (req, res) => {
  try {
    const expert = await Expert.findById(req.params.id);
    if (!expert) {
      return res.status(404).json({ error: 'Expert not found' });
    }
    res.json(expert);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/experts - создать эксперта (с генерацией уникальной ссылки)
router.post('/', async (req, res) => {
  try {
    const { eventId, fullName } = req.body;
    
    if (!eventId || !fullName) {
      return res.status(400).json({ error: 'EventId and full name are required' });
    }
    
    // Создаем нового эксперта
    const expert = new Expert({
      eventId,
      fullName
    });
    
    // Сохраняем эксперта (токен генерируется в pre-save хуке)
    await expert.save();
    
    // Формируем URL для QR кода ПОСЛЕ сохранения, когда токен уже сгенерирован
    // Приоритеты:
    // 1) Явная переменная окружения FRONTEND_BASE_URL (например, https://platform.brojs.ru)
    // 2) Проксируемые заголовки x-forwarded-proto / x-forwarded-host
    // 3) Локальные req.protocol + req.get('host')
    const forwardedProto = req.get('x-forwarded-proto');
    const forwardedHost = req.get('x-forwarded-host');
    const protocol = forwardedProto || req.protocol;
    const host = forwardedHost || req.get('host');
    const baseUrl = process.env.FRONTEND_BASE_URL || `${protocol}://${host}`;
    
    expert.qrCodeUrl = `${baseUrl}/assessment-tools/expert/${expert.token}`;
    
    // Сохраняем еще раз с обновленным qrCodeUrl
    await expert.save();
    
    res.status(201).json(expert);
  } catch (error) {
    console.error('Error creating expert:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/experts/:id - редактировать эксперта
router.put('/:id', async (req, res) => {
  try {
    const { fullName } = req.body;
    
    const expert = await Expert.findById(req.params.id);
    if (!expert) {
      return res.status(404).json({ error: 'Expert not found' });
    }
    
    if (fullName !== undefined) expert.fullName = fullName;
    
    await expert.save();
    res.json(expert);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/experts/:id - удалить эксперта
router.delete('/:id', async (req, res) => {
  try {
    const expert = await Expert.findByIdAndDelete(req.params.id);
    if (!expert) {
      return res.status(404).json({ error: 'Expert not found' });
    }
    res.json({ message: 'Expert deleted successfully', expert });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;


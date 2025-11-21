const router = require('express').Router();
const { Expert } = require('../models');

// GET /api/experts - список экспертов
router.get('/', async (req, res) => {
  try {
    const experts = await Expert.find().sort({ createdAt: -1 });
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
    const { fullName } = req.body;
    
    if (!fullName) {
      return res.status(400).json({ error: 'Full name is required' });
    }
    
    // Создаем нового эксперта
    const expert = new Expert({
      fullName
    });
    
    // Сохраняем эксперта (токен генерируется в pre-save хуке)
    await expert.save();
    
    // Формируем URL для QR кода ПОСЛЕ сохранения, когда токен уже сгенерирован
    const baseUrl = req.protocol + '://' + req.get('host');
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


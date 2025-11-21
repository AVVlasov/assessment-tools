const router = require('express').Router();
const { Criteria } = require('../models');

// Критерии по умолчанию из hack.md
const DEFAULT_CRITERIA = [
  {
    blockName: 'Оценка проекта',
    criteria: [
      { name: 'Соответствие решения поставленной задаче', maxScore: 5 },
      { name: 'Оригинальность - использование нестандартных технических и проектных подходов', maxScore: 5 },
      { name: 'Работоспособность решения', maxScore: 1 },
      { name: 'Технологическая сложность решения', maxScore: 2 },
      { name: 'Объем функциональных возможностей решения', maxScore: 2 },
      { name: 'Аргументация способа выбранного решения', maxScore: 5 },
      { name: 'Качество предоставления информации', maxScore: 5 },
      { name: 'Наличие удобного UX/UI', maxScore: 5 },
      { name: 'Наличие не менее 5 AI-агентов', maxScore: 5 }
    ],
    order: 0
  }
];

// GET /api/criteria - получить все блоки критериев
router.get('/', async (req, res) => {
  try {
    const criteria = await Criteria.find().sort({ order: 1 });
    res.json(criteria);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/criteria/:id - получить блок критериев по ID
router.get('/:id', async (req, res) => {
  try {
    const criteria = await Criteria.findById(req.params.id);
    if (!criteria) {
      return res.status(404).json({ error: 'Criteria not found' });
    }
    res.json(criteria);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/criteria - создать блок критериев
router.post('/', async (req, res) => {
  try {
    const { blockName, criteria, order } = req.body;
    
    if (!blockName || !criteria || !Array.isArray(criteria)) {
      return res.status(400).json({ error: 'Block name and criteria array are required' });
    }
    
    const criteriaBlock = await Criteria.create({
      blockName,
      criteria,
      order: order !== undefined ? order : 0
    });
    
    res.status(201).json(criteriaBlock);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/criteria/default - загрузить критерии по умолчанию из hack.md
router.post('/default', async (req, res) => {
  try {
    // Удаляем все существующие критерии
    await Criteria.deleteMany({});
    
    // Создаем критерии по умолчанию
    const createdCriteria = await Criteria.insertMany(DEFAULT_CRITERIA);
    
    res.status(201).json(createdCriteria);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/criteria/:id - редактировать блок
router.put('/:id', async (req, res) => {
  try {
    const { blockName, criteria, order } = req.body;
    
    const criteriaBlock = await Criteria.findById(req.params.id);
    if (!criteriaBlock) {
      return res.status(404).json({ error: 'Criteria not found' });
    }
    
    if (blockName !== undefined) criteriaBlock.blockName = blockName;
    if (criteria !== undefined) criteriaBlock.criteria = criteria;
    if (order !== undefined) criteriaBlock.order = order;
    
    await criteriaBlock.save();
    res.json(criteriaBlock);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/criteria/:id - удалить блок
router.delete('/:id', async (req, res) => {
  try {
    const criteria = await Criteria.findByIdAndDelete(req.params.id);
    if (!criteria) {
      return res.status(404).json({ error: 'Criteria not found' });
    }
    res.json({ message: 'Criteria deleted successfully', criteria });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;


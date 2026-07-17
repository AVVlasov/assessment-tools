const router = require('express').Router();
const { Event, Team } = require('../models');
const { hasBrokenEncoding, sanitizeText } = require('../utils/textEncoding');

const VALID_EVENT_TYPES = ['hackathon', 'queen_of_code', 'conference'];

// GET /api/events - получить все мероприятия
router.get('/', async (req, res) => {
  try {
    const events = await Event.find().sort({ eventDate: -1 });
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/events/:id - получить одно мероприятие
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({ error: 'Мероприятие не найдено' });
    }
    
    res.json(event);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const parseEventDate = (value) => {
  if (!value) return new Date();
  if (value instanceof Date) return value;
  const str = String(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return new Date(`${str}T12:00:00`);
  }
  const parsed = new Date(str);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
};

// POST /api/events - создать новое мероприятие
router.post('/', async (req, res) => {
  try {
    const { name, description, eventDate, location, status, eventType } = req.body;

    if (!eventType || !VALID_EVENT_TYPES.includes(eventType)) {
      return res.status(400).json({
        error: `eventType is required and must be one of: ${VALID_EVENT_TYPES.join(', ')}`
      });
    }

    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: 'name is required' });
    }

    if (
      hasBrokenEncoding(name) ||
      hasBrokenEncoding(description) ||
      hasBrokenEncoding(location)
    ) {
      return res.status(400).json({ error: 'Text fields contain broken encoding (use UTF-8)' });
    }

    const resolvedType = eventType;
    
    const event = await Event.create({
      name: sanitizeText(String(name)),
      eventType: resolvedType,
      description: sanitizeText(description || ''),
      eventDate: parseEventDate(eventDate),
      location: sanitizeText(location || ''),
      status: status || 'draft',
      votingEnabled: false
    });

    if (resolvedType === 'conference') {
      await Team.create({
        eventId: event._id,
        type: 'event',
        name: 'Общая оценка мероприятия',
        projectName: '',
        caseDescription: '',
        isActive: true
      });

      const { Hall } = require('../models');
      const { getDefaultCriteriaByEventType } = require('../api/defaultCriteria');
      const { Criteria } = require('../models');

      await Hall.create({
        eventId: event._id,
        name: 'Главный зал',
        num: 1,
        order: 0,
        status: 'break',
        qrNote: 'сам переключается на текущего спикера'
      });

      const defaults = getDefaultCriteriaByEventType('conference');
      await Criteria.insertMany(
        defaults.map((block) => ({
          eventId: event._id,
          blockName: block.blockName,
          criteriaType: block.criteriaType,
          criteria: block.criteria,
          order: block.order
        }))
      );
    }
    
    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/events/:id - обновить мероприятие (eventType не меняется)
router.put('/:id', async (req, res) => {
  try {
    const { name, description, eventDate, location, status } = req.body;
    
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({ error: 'Мероприятие не найдено' });
    }
    
    if (name !== undefined) event.name = name;
    if (description !== undefined) event.description = description;
    if (eventDate !== undefined) event.eventDate = parseEventDate(eventDate);
    if (location !== undefined) event.location = location;
    if (status !== undefined) event.status = status;
    
    await event.save();
    
    res.json(event);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/events/:id - удалить мероприятие
router.delete('/:id', async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    
    if (!event) {
      return res.status(404).json({ error: 'Мероприятие не найдено' });
    }
    
    res.json({ message: 'Мероприятие удалено', event });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/events/:id/toggle-voting - вкл/выкл оценку
router.patch('/:id/toggle-voting', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({ error: 'Мероприятие не найдено' });
    }
    
    event.votingEnabled = !event.votingEnabled;
    await event.save();
    
    res.json(event);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

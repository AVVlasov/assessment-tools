const router = require('express').Router();
const { Event } = require('../models');

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

// POST /api/events - создать новое мероприятие
router.post('/', async (req, res) => {
  try {
    const { name, description, eventDate, location, status } = req.body;
    
    const event = await Event.create({
      name: name || 'Новое мероприятие',
      description: description || '',
      eventDate: eventDate || new Date(),
      location: location || '',
      status: status || 'draft',
      votingEnabled: false
    });
    
    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/events/:id - обновить мероприятие
router.put('/:id', async (req, res) => {
  try {
    const { name, description, eventDate, location, status } = req.body;
    
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({ error: 'Мероприятие не найдено' });
    }
    
    if (name !== undefined) event.name = name;
    if (description !== undefined) event.description = description;
    if (eventDate !== undefined) event.eventDate = eventDate;
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


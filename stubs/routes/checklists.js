const router = require('express').Router();
const { ReadinessChecklist, Event } = require('../models');
const { hasBrokenEncoding, sanitizeText } = require('../utils/textEncoding');

const TYPES = ['talk', 'workshop'];
const WIDGETS = ['rehearsal', 'calendar', 'deck', 'approval'];
const DEFAULT_WIDGETS = [...WIDGETS];

const normalizeWidgets = (widgets) => {
  if (!Array.isArray(widgets)) return DEFAULT_WIDGETS.slice();
  const uniq = [];
  widgets.forEach((w) => {
    if (WIDGETS.includes(w) && !uniq.includes(w)) uniq.push(w);
  });
  return uniq;
};

const normalizeItems = (items) => {
  if (!Array.isArray(items)) return [];
  return items.map((it) => {
    const row = {
      text: sanitizeText(it?.text || ''),
      done: !!it?.done
    };
    if (it?._id) row._id = it._id;
    return row;
  });
};

// GET /api/checklists?eventId=
router.get('/', async (req, res) => {
  try {
    const { eventId } = req.query;
    if (!eventId) {
      return res.status(400).json({ error: 'eventId is required' });
    }
    const list = await ReadinessChecklist.find({ eventId }).sort({ order: 1, createdAt: 1 });
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/checklists
router.post('/', async (req, res) => {
  try {
    const { eventId, name, type, items, widgets } = req.body || {};
    if (!eventId) {
      return res.status(400).json({ error: 'eventId is required' });
    }
    if (hasBrokenEncoding(name)) {
      return res.status(400).json({ error: 'Text fields contain broken encoding (use UTF-8)' });
    }
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    const resolvedType = TYPES.includes(type) ? type : 'talk';
    const existing = await ReadinessChecklist.findOne({ eventId, type: resolvedType });
    if (existing) {
      return res.status(400).json({ error: 'Checklist for this type already exists' });
    }
    const count = await ReadinessChecklist.countDocuments({ eventId });
    const checklist = await ReadinessChecklist.create({
      eventId,
      name: sanitizeText(name, resolvedType === 'workshop' ? 'Воркшоп' : 'Доклад') || 'Чеклист',
      type: resolvedType,
      widgets: widgets !== undefined ? normalizeWidgets(widgets) : DEFAULT_WIDGETS.slice(),
      items: Array.isArray(items) ? normalizeItems(items) : [],
      order: count
    });
    res.status(201).json(checklist);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/checklists/:id
router.put('/:id', async (req, res) => {
  try {
    const checklist = await ReadinessChecklist.findById(req.params.id);
    if (!checklist) {
      return res.status(404).json({ error: 'Checklist not found' });
    }
    const { name, type, items, order, widgets } = req.body || {};
    if (name !== undefined) {
      if (hasBrokenEncoding(name)) {
        return res.status(400).json({ error: 'Text fields contain broken encoding (use UTF-8)' });
      }
      checklist.name = sanitizeText(name, checklist.name);
    }
    if (type !== undefined) {
      if (!TYPES.includes(type)) {
        return res.status(400).json({ error: 'Invalid type' });
      }
      const clash = await ReadinessChecklist.findOne({
        eventId: checklist.eventId,
        type,
        _id: { $ne: checklist._id }
      });
      if (clash) {
        return res.status(400).json({ error: 'Checklist for this type already exists' });
      }
      checklist.type = type;
    }
    if (widgets !== undefined) {
      checklist.widgets = normalizeWidgets(widgets);
    }
    if (items !== undefined) {
      if (!Array.isArray(items)) {
        return res.status(400).json({ error: 'items must be an array' });
      }
      for (const it of items) {
        if (hasBrokenEncoding(it?.text)) {
          return res.status(400).json({ error: 'Text fields contain broken encoding (use UTF-8)' });
        }
      }
      checklist.items = normalizeItems(items);
    }
    if (order !== undefined) checklist.order = Number(order) || 0;
    await checklist.save();
    res.json(checklist);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/checklists/:id
router.delete('/:id', async (req, res) => {
  try {
    const checklist = await ReadinessChecklist.findByIdAndDelete(req.params.id);
    if (!checklist) {
      return res.status(404).json({ error: 'Checklist not found' });
    }
    res.json({ message: 'Checklist deleted', checklist });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

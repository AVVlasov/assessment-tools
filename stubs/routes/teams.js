const router = require('express').Router();
const { Team, Event } = require('../models');
const { hasBrokenEncoding, sanitizeText, sanitizeStringArray } = require('../utils/textEncoding');

const ALLOWED_TYPES_BY_EVENT = {
  hackathon: ['team'],
  queen_of_code: ['participant'],
  conference: ['speaker', 'event']
};

const getAllowedTypes = (eventType) =>
  ALLOWED_TYPES_BY_EVENT[eventType] || ALLOWED_TYPES_BY_EVENT.hackathon;

const normalizeReadiness = (raw) => {
  const src = raw && typeof raw === 'object' ? raw : {};
  const reh = src.rehearsal && typeof src.rehearsal === 'object' ? src.rehearsal : {};
  const status = ['scheduled', 'passed'].includes(reh.status) ? reh.status : 'none';
  const checklistDone = Array.isArray(src.checklistDone)
    ? src.checklistDone.map((id) => String(id)).filter(Boolean)
    : [];
  return {
    rehearsal: {
      date: sanitizeText(reh.date || ''),
      time: sanitizeText(reh.time || ''),
      place: sanitizeText(reh.place || ''),
      status
    },
    calendarSet: !!src.calendarSet,
    deckStatus: src.deckStatus === 'uploaded' ? 'uploaded' : 'none',
    approval: src.approval === 'approved' ? 'approved' : 'pending',
    checklistDone
  };
};

// GET /api/teams - список всех команд
router.get('/', async (req, res) => {
  try {
    const { type, eventId } = req.query;
    const filter = {};
    if (type) filter.type = type;
    if (eventId) filter.eventId = eventId;
    const teams = await Team.find(filter).sort({ createdAt: -1 });
    res.json(teams);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/teams/active/voting - получить активную для оценки команду (ДОЛЖЕН БЫТЬ ПЕРЕД /:id)
router.get('/active/voting', async (req, res) => {
  try {
    const { eventId } = req.query;
    const filter = { isActiveForVoting: true };
    if (eventId) filter.eventId = eventId;
    const team = await Team.findOne(filter);
    res.json(team);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/teams/stop-all-voting/global - остановить все оценивания (ДОЛЖЕН БЫТЬ ПЕРЕД /:id)
router.patch('/stop-all-voting/global', async (req, res) => {
  try {
    const { eventId } = req.body;
    // Находим все команды, которые сейчас оцениваются
    const filter = { isActiveForVoting: true };
    if (eventId) filter.eventId = eventId;
    
    const result = await Team.updateMany(
      filter,
      { 
        isActiveForVoting: false,
        votingStatus: 'evaluated'
      }
    );
    
    res.json({ 
      message: 'All voting stopped successfully',
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/teams/:id - получить команду по ID
router.get('/:id', async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }
    res.json(team);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/teams - создать команду/участника/спикера
router.post('/', async (req, res) => {
  try {
    const {
      eventId, type, name, projectName, caseDescription,
      hallId, scheduledTime, org, format, order, coSpeakers, readiness
    } = req.body;
    
    if (!eventId || !type || !name) {
      return res.status(400).json({ error: 'EventId, type and name are required' });
    }

    if (
      hasBrokenEncoding(name) ||
      hasBrokenEncoding(projectName) ||
      hasBrokenEncoding(caseDescription) ||
      hasBrokenEncoding(org)
    ) {
      return res.status(400).json({ error: 'Text fields contain broken encoding (use UTF-8)' });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const allowedTypes = getAllowedTypes(event.eventType || 'hackathon');
    if (!allowedTypes.includes(type)) {
      return res.status(400).json({
        error: `Type "${type}" is not allowed for event type "${event.eventType}"`
      });
    }

    if (type === 'event') {
      const existing = await Team.findOne({ eventId, type: 'event' });
      if (existing) {
        return res.status(400).json({ error: 'Event rating entity already exists' });
      }
    }

    const count = await Team.countDocuments({ eventId, type });
    
    const team = await Team.create({
      eventId,
      type,
      name: sanitizeText(name),
      projectName: sanitizeText(projectName || ''),
      caseDescription: sanitizeText(caseDescription || ''),
      hallId: hallId || null,
      scheduledTime: sanitizeText(scheduledTime || ''),
      org: sanitizeText(org || ''),
      format: ['panel', 'workshop'].includes(format) ? format : 'talk',
      coSpeakers: sanitizeStringArray(Array.isArray(coSpeakers) ? coSpeakers : []),
      readiness: normalizeReadiness(readiness),
      order: order ?? count,
      isActive: true
    });
    
    res.status(201).json(team);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/teams/:id - редактировать команду
router.put('/:id', async (req, res) => {
  try {
    const {
      type, name, projectName, caseDescription,
      hallId, scheduledTime, org, format, order, programDone, coSpeakers, readiness
    } = req.body;
    
    const team = await Team.findById(req.params.id);
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    if (team.type === 'event' && type !== undefined && type !== 'event') {
      return res.status(400).json({ error: 'Cannot change type of event rating entity' });
    }

    if (type !== undefined && type !== team.type) {
      const event = await Event.findById(team.eventId);
      if (!event) {
        return res.status(404).json({ error: 'Event not found' });
      }
      const allowedTypes = getAllowedTypes(event.eventType || 'hackathon');
      if (!allowedTypes.includes(type)) {
        return res.status(400).json({
          error: `Type "${type}" is not allowed for event type "${event.eventType}"`
        });
      }
      team.type = type;
    }

    if (
      hasBrokenEncoding(name) ||
      hasBrokenEncoding(projectName) ||
      hasBrokenEncoding(caseDescription) ||
      hasBrokenEncoding(org) ||
      hasBrokenEncoding(scheduledTime)
    ) {
      return res.status(400).json({ error: 'Text fields contain broken encoding (use UTF-8)' });
    }
    if (name !== undefined) team.name = sanitizeText(name);
    if (projectName !== undefined) team.projectName = sanitizeText(projectName);
    if (caseDescription !== undefined) team.caseDescription = sanitizeText(caseDescription);
    if (hallId !== undefined) team.hallId = hallId || null;
    if (scheduledTime !== undefined) team.scheduledTime = sanitizeText(scheduledTime);
    if (org !== undefined) team.org = sanitizeText(org);
    if (format !== undefined) {
      team.format = ['panel', 'workshop'].includes(format) ? format : 'talk';
    }
    if (order !== undefined) team.order = order;
    if (programDone !== undefined) team.programDone = !!programDone;
    if (coSpeakers !== undefined) {
      team.coSpeakers = sanitizeStringArray(Array.isArray(coSpeakers) ? coSpeakers : []);
    }
    if (readiness !== undefined) {
      team.readiness = normalizeReadiness(readiness);
    }
    
    await team.save();
    res.json(team);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/teams/:id - удалить команду
router.delete('/:id', async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    if (team.type === 'event') {
      return res.status(400).json({ error: 'Cannot delete event rating entity' });
    }

    await Team.findByIdAndDelete(req.params.id);
    res.json({ message: 'Team deleted successfully', team });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/teams/:id/activate-for-voting - активировать команду для оценки
router.patch('/:id/activate-for-voting', async (req, res) => {
  try {
    // Получаем команду для активации
    const team = await Team.findById(req.params.id);
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }
    
    // Деактивируем все команды этого мероприятия
    const previouslyActive = await Team.findOne({ 
      isActiveForVoting: true,
      eventId: team.eventId
    });
    if (previouslyActive) {
      previouslyActive.isActiveForVoting = false;
      previouslyActive.votingStatus = 'evaluated';
      await previouslyActive.save();
    }
    
    // Активируем выбранную команду
    team.isActiveForVoting = true;
    team.votingStatus = 'evaluating';
    await team.save();
    
    res.json(team);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/teams/:id/stop-voting - остановить оценивание конкретной команды
router.patch('/:id/stop-voting', async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }
    
    team.isActiveForVoting = false;
    team.votingStatus = 'evaluated';
    await team.save();
    
    res.json(team);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/teams/:id/toggle-active - остановить оценку команды
router.patch('/:id/toggle-active', async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }
    
    team.isActive = !team.isActive;
    await team.save();
    
    res.json(team);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

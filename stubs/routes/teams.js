const router = require('express').Router();
const { Team } = require('../models');

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

// POST /api/teams - создать команду/участника
router.post('/', async (req, res) => {
  try {
    const { eventId, type, name, projectName, caseDescription } = req.body;
    
    if (!eventId || !type || !name) {
      return res.status(400).json({ error: 'EventId, type and name are required' });
    }
    
    const team = await Team.create({
      eventId,
      type,
      name,
      projectName: projectName || '',
      caseDescription: caseDescription || '',
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
    const { type, name, projectName, caseDescription } = req.body;
    
    const team = await Team.findById(req.params.id);
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }
    
    if (type !== undefined) team.type = type;
    if (name !== undefined) team.name = name;
    if (projectName !== undefined) team.projectName = projectName;
    if (caseDescription !== undefined) team.caseDescription = caseDescription;
    
    await team.save();
    res.json(team);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/teams/:id - удалить команду
router.delete('/:id', async (req, res) => {
  try {
    const team = await Team.findByIdAndDelete(req.params.id);
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }
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

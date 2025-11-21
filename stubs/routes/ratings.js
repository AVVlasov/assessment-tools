const router = require('express').Router();
const { Rating, Team, Expert, Criteria } = require('../models');

// GET /api/ratings - получить все оценки (с фильтрами)
router.get('/', async (req, res) => {
  try {
    const { expertId, teamId, eventId } = req.query;
    const filter = {};
    
    if (expertId) filter.expertId = expertId;
    if (teamId) filter.teamId = teamId;
    if (eventId) filter.eventId = eventId;
    
    const ratings = await Rating.find(filter)
      .populate('expertId', 'fullName')
      .populate('teamId', 'name type')
      .sort({ createdAt: -1 });
    
    res.json(ratings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/ratings/team/:teamId - оценки конкретной команды
router.get('/team/:teamId', async (req, res) => {
  try {
    const ratings = await Rating.find({ teamId: req.params.teamId })
      .populate('expertId', 'fullName')
      .populate('teamId', 'name type projectName');
    
    res.json(ratings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/ratings/expert/:expertId - оценки конкретного эксперта
router.get('/expert/:expertId', async (req, res) => {
  try {
    const ratings = await Rating.find({ expertId: req.params.expertId })
      .populate('teamId', 'name type projectName');
    
    res.json(ratings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/ratings/statistics - статистика с группировкой по командам
router.get('/statistics', async (req, res) => {
  try {
    const { type, eventId } = req.query;
    
    // Получаем все команды
    const teamFilter = { isActive: true };
    if (type) teamFilter.type = type;
    if (eventId) teamFilter.eventId = eventId;
    const teams = await Team.find(teamFilter);
    
    // Получаем все оценки
    const ratingFilter = {};
    if (eventId) ratingFilter.eventId = eventId;
    const ratings = await Rating.find(ratingFilter)
      .populate('expertId', 'fullName')
      .populate('teamId', 'name type projectName');
    
    // Группируем оценки по командам
    const statistics = teams.map(team => {
      const teamRatings = ratings.filter(r => r.teamId && r.teamId._id.toString() === team._id.toString());
      
      // Считаем средние оценки по критериям
      const criteriaStats = {};
      teamRatings.forEach(rating => {
        rating.ratings.forEach(item => {
          if (!criteriaStats[item.criterionName]) {
            criteriaStats[item.criterionName] = {
              name: item.criterionName,
              scores: [],
              average: 0
            };
          }
          criteriaStats[item.criterionName].scores.push(item.score);
        });
      });
      
      // Вычисляем средние значения
      Object.keys(criteriaStats).forEach(key => {
        const scores = criteriaStats[key].scores;
        criteriaStats[key].average = scores.reduce((sum, s) => sum + s, 0) / scores.length;
      });
      
      // Считаем общий балл команды (среднее от всех экспертов)
      const totalScore = teamRatings.length > 0
        ? teamRatings.reduce((sum, r) => sum + r.totalScore, 0) / teamRatings.length
        : 0;
      
      return {
        team: {
          _id: team._id,
          name: team.name,
          type: team.type,
          projectName: team.projectName
        },
        ratings: teamRatings.map(r => ({
          expert: r.expertId ? r.expertId.fullName : 'Unknown',
          criteria: r.ratings,
          totalScore: r.totalScore
        })),
        criteriaStats: Object.values(criteriaStats),
        totalScore: totalScore,
        ratingsCount: teamRatings.length
      };
    });
    
    res.json(statistics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/ratings/top3 - топ-3 команды и топ-3 участники отдельно
// ВАЖНО: всегда возвращаем объект вида { teams: Top3Item[], participants: Top3Item[] },
// чтобы фронтенд мог безопасно работать с data.teams / data.participants
router.get('/top3', async (req, res) => {
  try {
    const { type, eventId } = req.query;

    // Получаем все активные команды/участников
    const teamFilter = { isActive: true };
    if (eventId) teamFilter.eventId = eventId;
    const teams = await Team.find(teamFilter);

    const ratingFilter = {};
    if (eventId) ratingFilter.eventId = eventId;
    const ratings = await Rating.find(ratingFilter).populate('teamId', 'name type projectName');

    const calculateTop3 = (sourceTeams) => {
      const teamScores = sourceTeams.map((team) => {
        const teamRatings = ratings.filter(
          (r) => r.teamId && r.teamId._id.toString() === team._id.toString()
        );

        const totalScore =
          teamRatings.length > 0
            ? teamRatings.reduce((sum, r) => sum + r.totalScore, 0) / teamRatings.length
            : 0;

        return {
          team: {
            _id: team._id,
            name: team.name,
            type: team.type,
            projectName: team.projectName
          },
          totalScore,
          ratingsCount: teamRatings.length
        };
      });

      return teamScores
        .filter((t) => t.ratingsCount > 0)
        .sort((a, b) => b.totalScore - a.totalScore)
        .slice(0, 3);
    };

    const teamEntities = teams.filter((t) => t.type === 'team');
    const participantEntities = teams.filter((t) => t.type === 'participant');

    const teamTop3 = calculateTop3(teamEntities);
    const participantTop3 = calculateTop3(participantEntities);

    // Параметр type управляет только содержимым, но не форматом ответа
    const response = {
      teams: !type || type === 'team' ? teamTop3 : [],
      participants: !type || type === 'participant' ? participantTop3 : []
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/ratings - создать/обновить оценку эксперта
router.post('/', async (req, res) => {
  try {
    const { eventId, expertId, teamId, ratings } = req.body;
    
    if (!eventId || !expertId || !teamId || !ratings || !Array.isArray(ratings)) {
      return res.status(400).json({ error: 'EventId, expert ID, team ID, and ratings array are required' });
    }
    
    // Проверяем существование эксперта и команды
    const expert = await Expert.findById(expertId);
    const team = await Team.findById(teamId);
    
    if (!expert) {
      return res.status(404).json({ error: 'Expert not found' });
    }
    
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }
    
    // Проверяем, активна ли команда
    if (!team.isActive) {
      return res.status(400).json({ error: 'Team voting is disabled' });
    }
    
    // Ищем существующую оценку
    let rating = await Rating.findOne({ eventId, expertId, teamId });
    
    if (rating) {
      // Обновляем существующую оценку
      rating.ratings = ratings;
      await rating.save();
    } else {
      // Создаем новую оценку
      rating = await Rating.create({
        eventId,
        expertId,
        teamId,
        ratings
      });
    }
    
    // Возвращаем с populate
    rating = await Rating.findById(rating._id)
      .populate('expertId', 'fullName')
      .populate('teamId', 'name type projectName');
    
    res.status(rating ? 200 : 201).json(rating);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;


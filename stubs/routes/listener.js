const router = require('express').Router();
const { Hall, Team, Event, Criteria, ListenerRating } = require('../models');

const SESSION_TARGET_TYPES = ['speaker', 'panel', 'workshop'];

const flattenCriteria = (blocks, type) => {
  const matched = blocks.filter((b) => b.criteriaType === type || (type === 'speaker' && b.criteriaType === 'all'));
  const items = [];
  matched.forEach((block) => {
    (block.criteria || []).forEach((c) => {
      items.push({
        name: c.name,
        tag: c.tag || c.name,
        hint: c.hint || '',
        maxScore: c.maxScore || 5,
        options: c.options || []
      });
    });
  });
  return items;
};

const resolveSessionKind = (speaker, hall) => {
  if (!speaker) return 'speaker';
  if (speaker.format === 'panel' || /панел|дискусс/i.test(`${speaker.name} ${speaker.projectName}`)) {
    return 'panel';
  }
  if (
    speaker.format === 'workshop' ||
    /воркшоп|workshop/i.test(`${speaker.name} ${speaker.projectName}`) ||
    (hall && /воркшоп|агенты|gen\s*ai/i.test(hall.name))
  ) {
    return 'workshop';
  }
  return 'speaker';
};

// GET /api/listener/hall/:token
router.get('/hall/:token', async (req, res) => {
  try {
    const hall = await Hall.findOne({ token: req.params.token });
    if (!hall) {
      return res.status(404).json({ error: 'Hall not found' });
    }
    const event = await Event.findById(hall.eventId);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    const speakers = await Team.find({ eventId: hall.eventId, type: 'speaker', hallId: hall._id })
      .sort({ order: 1, scheduledTime: 1 });
    const idx = Math.min(hall.currentSpeakerIndex, Math.max(speakers.length - 1, 0));
    const currentSpeaker = speakers[idx] || null;
    const nextSpeaker = speakers[idx + 1] || null;
    const criteriaBlocks = await Criteria.find({ eventId: hall.eventId }).sort({ order: 1 });

    const sessionKind = resolveSessionKind(currentSpeaker, hall);
    const isPanel = sessionKind === 'panel';
    const isWorkshop = sessionKind === 'workshop';
    const speakerCriteria = flattenCriteria(criteriaBlocks, 'speaker');
    const eventCriteria = flattenCriteria(criteriaBlocks, 'event');
    const panelCriteria = flattenCriteria(criteriaBlocks, 'panel');
    const workshopCriteria = flattenCriteria(criteriaBlocks, 'workshop');

    let ratingsCount = 0;
    if (currentSpeaker) {
      ratingsCount = await ListenerRating.countDocuments({
        teamId: currentSpeaker._id,
        targetType: { $in: SESSION_TARGET_TYPES }
      });
    }

    res.json({
      hall,
      event,
      currentSpeaker,
      nextSpeaker,
      speakers,
      isPanel,
      isWorkshop,
      criteria: {
        speaker: speakerCriteria,
        panel: panelCriteria,
        workshop: workshopCriteria.length ? workshopCriteria : speakerCriteria.filter((c) => !/слайд/i.test(c.name)),
        event: eventCriteria
      },
      ratingsCount,
      reactions: {
        speaker: ['демо не упало', 'унёс в прод', 'проснулся ради этого', 'хочу слайды', 'это был дипфейк?'],
        workshop: ['разобрал руками', 'унёс в прод', 'хватило времени', 'нужен ноутбук', 'хочу ещё слот'],
        event: ['кофе топ', 'мерч огонь', 'wifi выдержал', 'приду ещё', 'где записи?']
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/listener/hall/:token/place?teamId=
router.get('/hall/:token/place', async (req, res) => {
  try {
    const hall = await Hall.findOne({ token: req.params.token });
    if (!hall) {
      return res.status(404).json({ error: 'Hall not found' });
    }
    const { teamId } = req.query;
    const count = teamId
      ? await ListenerRating.countDocuments({ teamId, targetType: { $in: SESSION_TARGET_TYPES } })
      : await ListenerRating.countDocuments({ eventId: hall.eventId, targetType: 'event' });
    res.json({ place: count + 1, count });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/listener/ratings
router.post('/ratings', async (req, res) => {
  try {
    const {
      eventId,
      hallId,
      teamId,
      targetType = 'speaker',
      sessionId,
      scores,
      reactions = [],
      elapsedSeconds = 0
    } = req.body;

    if (!eventId || !sessionId || !scores || !scores.length) {
      return res.status(400).json({ error: 'eventId, sessionId and scores are required' });
    }

    const filter = targetType === 'event'
      ? { sessionId, eventId, targetType: 'event' }
      : { sessionId, teamId, targetType };

    const averageScore = scores.reduce((a, s) => a + s.score, 0) / scores.length;

    const rating = await ListenerRating.findOneAndUpdate(
      filter,
      {
        eventId,
        hallId: hallId || null,
        teamId: teamId || null,
        targetType,
        sessionId,
        scores,
        reactions,
        elapsedSeconds,
        averageScore
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const placeFilter = targetType === 'event'
      ? { eventId, targetType: 'event' }
      : { teamId, targetType: { $in: ['speaker', 'panel'] } };
    const place = await ListenerRating.countDocuments(placeFilter);

    res.status(201).json({ rating, place });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: 'Already rated' });
    }
    res.status(500).json({ error: error.message });
  }
});

// GET /api/listener/stats?eventId=&hallId=
router.get('/stats', async (req, res) => {
  try {
    const { eventId, hallId } = req.query;
    if (!eventId) {
      return res.status(400).json({ error: 'eventId is required' });
    }

    const speakerFilter = { eventId, type: 'speaker' };
    if (hallId && hallId !== 'all') {
      speakerFilter.hallId = hallId;
    }
    const speakers = await Team.find(speakerFilter).sort({ order: 1, scheduledTime: 1 });
    const halls = await Hall.find({ eventId }).sort({ order: 1, num: 1 });
    const hallMap = Object.fromEntries(halls.map((h) => [String(h._id), h]));

    const leaderboard = [];
    const reactionCounts = {};

    for (const sp of speakers) {
      const ratings = await ListenerRating.find({
        teamId: sp._id,
        targetType: { $in: SESSION_TARGET_TYPES }
      });
      if (!ratings.length) continue;

      const criterionAgg = {};
      ratings.forEach((r) => {
        (r.scores || []).forEach((s) => {
          if (!criterionAgg[s.criterionName]) criterionAgg[s.criterionName] = [];
          criterionAgg[s.criterionName].push(s.score);
        });
        (r.reactions || []).forEach((rx) => {
          reactionCounts[rx] = (reactionCounts[rx] || 0) + 1;
        });
      });

      const bars = Object.entries(criterionAgg).map(([name, vals]) => ({
        name,
        val: Number((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1)),
        w: Math.round((vals.reduce((a, b) => a + b, 0) / vals.length / 5) * 100)
      }));

      const avg = ratings.reduce((a, r) => a + r.averageScore, 0) / ratings.length;
      const hall = hallMap[String(sp.hallId)];

      leaderboard.push({
        teamId: sp._id,
        name: sp.name,
        talk: sp.projectName,
        hall: hall ? hall.name : '',
        hallId: sp.hallId,
        n: ratings.length,
        scores: bars.map((b) => b.val),
        bars,
        total: Number(avg.toFixed(1)),
        topReaction: Object.entries(reactionCounts).sort((a, b) => b[1] - a[1])[0]
          ? `«${Object.entries(reactionCounts).sort((a, b) => b[1] - a[1])[0][0]}»`
          : ''
      });
    }

    leaderboard.sort((a, b) => b.total - a.total);

    const totalRatings = await ListenerRating.countDocuments({
      eventId,
      targetType: { $in: [...SESSION_TARGET_TYPES, 'event'] }
    });

    const topReactions = Object.entries(reactionCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([label, count]) => ({ label, count }));

    // Speakers table rows
    const allSpeakers = await Team.find({ eventId, type: 'speaker' }).sort({ scheduledTime: 1, order: 1 });
    const speakerRows = await Promise.all(allSpeakers.map(async (sp) => {
      const hall = hallMap[String(sp.hallId)];
      const ratings = await ListenerRating.find({
        teamId: sp._id,
        targetType: { $in: SESSION_TARGET_TYPES }
      });
      const isLive = hall && hall.status === 'live' &&
        String((await Team.find({ hallId: hall._id, type: 'speaker' }).sort({ order: 1, scheduledTime: 1 }))[hall.currentSpeakerIndex]?._id) === String(sp._id);
      const avg = ratings.length
        ? ratings.reduce((a, r) => a + r.averageScore, 0) / ratings.length
        : 0;
      return {
        _id: sp._id,
        time: sp.scheduledTime || '—',
        name: sp.name,
        talk: sp.projectName,
        hall: hall ? hall.name : '—',
        hallId: sp.hallId,
        status: isLive ? 'live' : (ratings.length ? 'done' : 'waiting'),
        avg: ratings.length ? Number(avg.toFixed(1)) : null,
        n: ratings.length,
        format: sp.format,
        org: sp.org
      };
    }));

    res.json({
      totalRatings,
      leaderboard,
      topReactions,
      speakerRows,
      halls
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/listener/ratings/speaker/:teamId — сброс оценок спикера
router.delete('/ratings/speaker/:teamId', async (req, res) => {
  try {
    const result = await ListenerRating.deleteMany({
      teamId: req.params.teamId,
      targetType: { $in: SESSION_TARGET_TYPES }
    });
    res.json({ message: 'Speaker ratings cleared', deletedCount: result.deletedCount || 0 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/listener/ratings/hall/:hallId — сброс оценок зала
router.delete('/ratings/hall/:hallId', async (req, res) => {
  try {
    const result = await ListenerRating.deleteMany({
      hallId: req.params.hallId,
      targetType: { $in: SESSION_TARGET_TYPES }
    });
    res.json({ message: 'Hall ratings cleared', deletedCount: result.deletedCount || 0 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/listener/ratings/event/:eventId — сброс всех оценок мероприятия
router.delete('/ratings/event/:eventId', async (req, res) => {
  try {
    const result = await ListenerRating.deleteMany({ eventId: req.params.eventId });
    res.json({ message: 'Event ratings cleared', deletedCount: result.deletedCount || 0 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/listener/stats/csv?eventId=
router.get('/stats/csv', async (req, res) => {
  try {
    const { eventId } = req.query;
    if (!eventId) {
      return res.status(400).json({ error: 'eventId is required' });
    }
    const ratings = await ListenerRating.find({ eventId }).populate('teamId', 'name projectName');
    const lines = ['sessionId,targetType,speaker,talk,average,elapsed,reactions,scores'];
    ratings.forEach((r) => {
      const speaker = r.teamId && r.teamId.name ? r.teamId.name : '';
      const talk = r.teamId && r.teamId.projectName ? r.teamId.projectName : '';
      const scores = (r.scores || []).map((s) => `${s.criterionName}:${s.score}`).join('|');
      lines.push([
        r.sessionId,
        r.targetType,
        `"${speaker.replace(/"/g, '""')}"`,
        `"${talk.replace(/"/g, '""')}"`,
        r.averageScore,
        r.elapsedSeconds,
        `"${(r.reactions || []).join(';')}"`,
        `"${scores}"`
      ].join(','));
    });
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="listener-stats.csv"');
    res.send('\uFEFF' + lines.join('\n'));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

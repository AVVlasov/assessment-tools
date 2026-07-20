const router = require('express').Router();
const { Hall, Team, Event, Criteria, ListenerRating } = require('../models');
const {
  hasBrokenEncoding,
  isUsableText,
  sanitizeStringArray,
  sanitizeScores
} = require('../utils/textEncoding');

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

    // Персональный контекст сессии: уже ли слушатель оценил текущего спикера / конференцию
    const sessionId = req.query.sessionId;
    let alreadyRatedSpeaker = false;
    let alreadyRatedEvent = false;
    let previousSpeakerRating = null;
    let previousEventRating = null;
    if (sessionId) {
      if (currentSpeaker) {
        const prev = await ListenerRating.findOne({
          sessionId,
          teamId: currentSpeaker._id,
          targetType: { $in: SESSION_TARGET_TYPES }
        });
        if (prev) {
          alreadyRatedSpeaker = true;
          previousSpeakerRating = {
            averageScore: prev.averageScore,
            elapsedSeconds: prev.elapsedSeconds,
            reactions: prev.reactions || [],
            createdAt: prev.createdAt
          };
        }
      }
      const prevEvent = await ListenerRating.findOne({ sessionId, eventId: hall.eventId, targetType: 'event' });
      if (prevEvent) {
        alreadyRatedEvent = true;
        previousEventRating = {
          averageScore: prevEvent.averageScore,
          elapsedSeconds: prevEvent.elapsedSeconds,
          reactions: prevEvent.reactions || [],
          createdAt: prevEvent.createdAt
        };
      }
    }

    res.json({
      hall,
      event,
      eventEnded: event.status === 'completed',
      currentSpeaker,
      nextSpeaker,
      speakers,
      isPanel,
      isWorkshop,
      alreadyRatedSpeaker,
      alreadyRatedEvent,
      previousSpeakerRating,
      previousEventRating,
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

    if (targetType !== 'event') {
      if (!hallId) {
        return res.status(400).json({ error: 'hallId is required' });
      }
      const hall = await Hall.findById(hallId);
      if (!hall) {
        return res.status(404).json({ error: 'Hall not found' });
      }
      if (hall.status !== 'live') {
        return res.status(403).json({ error: 'Voting is stopped for this hall' });
      }
    }

    const cleanedScores = sanitizeScores(scores);
    if (!cleanedScores) {
      return res.status(400).json({
        error: 'scores contain invalid or broken encoding text (use UTF-8)'
      });
    }

    const cleanedReactions = sanitizeStringArray(reactions);

    const filter = targetType === 'event'
      ? { sessionId, eventId, targetType: 'event' }
      : { sessionId, teamId, targetType };

    const averageScore = cleanedScores.reduce((a, s) => a + s.score, 0) / cleanedScores.length;

    const rating = await ListenerRating.findOneAndUpdate(
      filter,
      {
        eventId,
        hallId: hallId || null,
        teamId: teamId || null,
        targetType,
        sessionId,
        scores: cleanedScores,
        reactions: cleanedReactions,
        elapsedSeconds,
        averageScore
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const placeFilter = targetType === 'event'
      ? { eventId, targetType: 'event' }
      : { teamId, targetType: { $in: SESSION_TARGET_TYPES } };
    const place = await ListenerRating.countDocuments(placeFilter);

    res.status(201).json({ rating, place });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: 'Already rated' });
    }
    res.status(500).json({ error: error.message });
  }
});

// POST /api/listener/ratings/reactions — обновить только реакции существующей оценки
router.post('/ratings/reactions', async (req, res) => {
  try {
    const { eventId, teamId, targetType = 'speaker', sessionId, reactions = [] } = req.body;

    if (!sessionId || (!teamId && targetType !== 'event')) {
      return res.status(400).json({ error: 'sessionId and target are required' });
    }

    const filter = targetType === 'event'
      ? { sessionId, eventId, targetType: 'event' }
      : { sessionId, teamId, targetType };

    const cleanedReactions = sanitizeStringArray(reactions);

    const rating = await ListenerRating.findOneAndUpdate(
      filter,
      { reactions: cleanedReactions },
      { new: true }
    );

    if (!rating) {
      return res.status(404).json({ error: 'Rating not found for this session' });
    }

    res.json({ rating });
  } catch (error) {
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
    const criteriaBlocks = await Criteria.find({ eventId }).sort({ order: 1 });
    const flatByType = {
      speaker: flattenCriteria(criteriaBlocks, 'speaker'),
      panel: flattenCriteria(criteriaBlocks, 'panel'),
      workshop: flattenCriteria(criteriaBlocks, 'workshop'),
      event: flattenCriteria(criteriaBlocks, 'event')
    };
    const criteriaByType = {
      speaker: flatByType.speaker.map((c) => c.name),
      panel: flatByType.panel.map((c) => c.name),
      workshop: flatByType.workshop.map((c) => c.name),
      event: flatByType.event.map((c) => c.name)
    };
    const tagByName = {};
    Object.values(flatByType).forEach((list) => {
      list.forEach((c) => {
        if (c.name) tagByName[c.name] = c.tag || c.name;
        if (c.tag) tagByName[c.tag] = c.tag;
      });
    });

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
        const fallbackNames = criteriaByType[r.targetType] || criteriaByType.speaker;
        (r.scores || []).forEach((s, idx) => {
          const name = isUsableText(s.criterionName)
            ? s.criterionName
            : (fallbackNames[idx] || null);
          if (!name || hasBrokenEncoding(name)) return;
          const label = tagByName[name] || name;
          if (!criterionAgg[label]) criterionAgg[label] = [];
          criterionAgg[label].push(s.score);
        });
        (r.reactions || []).forEach((rx) => {
          if (!isUsableText(rx)) return;
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
    const speakersByHall = {};
    allSpeakers.forEach((sp) => {
      const key = String(sp.hallId || '');
      if (!speakersByHall[key]) speakersByHall[key] = [];
      speakersByHall[key].push(sp);
    });
    Object.values(speakersByHall).forEach((list) => {
      list.sort((a, b) => (a.order || 0) - (b.order || 0) || String(a.scheduledTime || '').localeCompare(String(b.scheduledTime || '')));
    });

    const speakerRows = await Promise.all(allSpeakers.map(async (sp) => {
      const hall = hallMap[String(sp.hallId)];
      const hallSpeakers = speakersByHall[String(sp.hallId || '')] || [];
      const idx = hallSpeakers.findIndex((s) => String(s._id) === String(sp._id));
      const ratings = await ListenerRating.find({
        teamId: sp._id,
        targetType: { $in: SESSION_TARGET_TYPES }
      });
      const isLive = !!(hall && hall.status === 'live' && idx === hall.currentSpeakerIndex);
      const isDone = !isLive && (
        sp.programDone === true ||
        (sp.programDone !== false && idx >= 0 && idx < (hall?.currentSpeakerIndex || 0))
      );
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
        hallColor: hall?.color || '#4FC9F0',
        status: isLive ? 'live' : (isDone ? 'done' : 'waiting'),
        programDone: !!isDone,
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

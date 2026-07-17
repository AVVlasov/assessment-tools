const router = require('express').Router();
const { Hall, Team, Event, ListenerRating } = require('../models');

const avgOfScores = (scores) => {
  if (!scores || !scores.length) return 0;
  return scores.reduce((a, b) => a + b, 0) / scores.length;
};

// GET /api/halls?eventId=
router.get('/', async (req, res) => {
  try {
    const { eventId } = req.query;
    if (!eventId) {
      return res.status(400).json({ error: 'eventId is required' });
    }
    const halls = await Hall.find({ eventId }).sort({ order: 1, num: 1 });
    const speakers = await Team.find({ eventId, type: 'speaker' }).sort({ order: 1, scheduledTime: 1 });

    const enriched = await Promise.all(halls.map(async (hall) => {
      const hallSpeakers = speakers.filter((s) => String(s.hallId) === String(hall._id));
      const cur = hallSpeakers[hall.currentSpeakerIndex] || hallSpeakers[0] || null;
      let n = 0;
      let avg = 0;
      if (cur) {
        const ratings = await ListenerRating.find({ teamId: cur._id, targetType: { $in: ['speaker', 'panel', 'workshop'] } });
        n = ratings.length;
        avg = n ? ratings.reduce((a, r) => a + r.averageScore, 0) / n : 0;
      }
      return {
        ...hall.toObject(),
        speakers: hallSpeakers,
        currentSpeaker: cur,
        ratingsCount: n,
        averageScore: avg ? Number(avg.toFixed(1)) : 0
      };
    }));

    res.json(enriched);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/halls
router.post('/', async (req, res) => {
  try {
    const { eventId, name, num, qrNote, order } = req.body;
    if (!eventId || !name) {
      return res.status(400).json({ error: 'eventId and name are required' });
    }
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    const count = await Hall.countDocuments({ eventId });
    const hall = await Hall.create({
      eventId,
      name,
      num: num || count + 1,
      qrNote: qrNote || 'сам переключается на текущего спикера',
      order: order ?? count,
      status: 'break',
      currentSpeakerIndex: 0
    });
    res.status(201).json(hall);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/halls/:id
router.put('/:id', async (req, res) => {
  try {
    const hall = await Hall.findById(req.params.id);
    if (!hall) {
      return res.status(404).json({ error: 'Hall not found' });
    }
    const { name, num, qrNote, status, order, currentSpeakerIndex } = req.body;
    if (name !== undefined) hall.name = name;
    if (num !== undefined) hall.num = num;
    if (qrNote !== undefined) hall.qrNote = qrNote;
    if (status !== undefined) hall.status = status;
    if (order !== undefined) hall.order = order;
    if (currentSpeakerIndex !== undefined) hall.currentSpeakerIndex = currentSpeakerIndex;
    await hall.save();
    res.json(hall);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/halls/:id
router.delete('/:id', async (req, res) => {
  try {
    const hall = await Hall.findByIdAndDelete(req.params.id);
    if (!hall) {
      return res.status(404).json({ error: 'Hall not found' });
    }
    await Team.updateMany({ hallId: hall._id }, { $set: { hallId: null } });
    res.json({ message: 'Hall deleted', hall });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/halls/:id/next — переключить спикера / live↔break
router.post('/:id/next', async (req, res) => {
  try {
    const hall = await Hall.findById(req.params.id);
    if (!hall) {
      return res.status(404).json({ error: 'Hall not found' });
    }
    const speakers = await Team.find({ eventId: hall.eventId, type: 'speaker', hallId: hall._id })
      .sort({ order: 1, scheduledTime: 1 });

    if (!speakers.length) {
      return res.status(400).json({ error: 'No speakers in this hall' });
    }

    if (hall.status === 'break') {
      hall.status = 'live';
    } else if (hall.currentSpeakerIndex < speakers.length - 1) {
      hall.currentSpeakerIndex += 1;
    } else {
      hall.status = 'break';
    }

    // Sync isActiveForVoting for conference live speaker
    await Team.updateMany(
      { eventId: hall.eventId, type: 'speaker', hallId: hall._id },
      { $set: { isActiveForVoting: false, votingStatus: 'not_evaluated' } }
    );
    if (hall.status === 'live') {
      const cur = speakers[hall.currentSpeakerIndex];
      if (cur) {
        cur.isActiveForVoting = true;
        cur.votingStatus = 'evaluating';
        await cur.save();
      }
    }

    await hall.save();
    const currentSpeaker = speakers[hall.currentSpeakerIndex] || null;
    res.json({ ...hall.toObject(), speakers, currentSpeaker });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/halls/:id/qr
router.get('/:id/qr', async (req, res) => {
  try {
    const hall = await Hall.findById(req.params.id);
    if (!hall) {
      return res.status(404).json({ error: 'Hall not found' });
    }
    const speakers = await Team.find({ eventId: hall.eventId, type: 'speaker', hallId: hall._id })
      .sort({ order: 1, scheduledTime: 1 });
    const currentSpeaker = speakers[hall.currentSpeakerIndex] || null;
    const path = `/assessment-tools/rate/hall/${hall.token}`;
    res.json({
      hall,
      currentSpeaker,
      path,
      token: hall.token
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const syncHallVoting = async (hall, speakers) => {
  await Team.updateMany(
    { eventId: hall.eventId, type: 'speaker', hallId: hall._id },
    { $set: { isActiveForVoting: false, votingStatus: 'not_evaluated' } }
  );
  if (hall.status === 'live') {
    const cur = speakers[hall.currentSpeakerIndex];
    if (cur) {
      cur.isActiveForVoting = true;
      cur.votingStatus = 'evaluating';
      await cur.save();
    }
  }
};

// POST /api/halls/:id/pause — пауза / кофе-брейк
router.post('/:id/pause', async (req, res) => {
  try {
    const hall = await Hall.findById(req.params.id);
    if (!hall) {
      return res.status(404).json({ error: 'Hall not found' });
    }
    hall.status = 'break';
    const speakers = await Team.find({ eventId: hall.eventId, type: 'speaker', hallId: hall._id })
      .sort({ order: 1, scheduledTime: 1 });
    await syncHallVoting(hall, speakers);
    await hall.save();
    res.json({
      ...hall.toObject(),
      speakers,
      currentSpeaker: speakers[hall.currentSpeakerIndex] || null
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/halls/:id/restart — с начала сетки зала
router.post('/:id/restart', async (req, res) => {
  try {
    const hall = await Hall.findById(req.params.id);
    if (!hall) {
      return res.status(404).json({ error: 'Hall not found' });
    }
    const { clearRatings } = req.body || {};
    hall.status = 'break';
    hall.currentSpeakerIndex = 0;
    const speakers = await Team.find({ eventId: hall.eventId, type: 'speaker', hallId: hall._id })
      .sort({ order: 1, scheduledTime: 1 });
    await syncHallVoting(hall, speakers);
    await hall.save();

    let deleted = 0;
    if (clearRatings) {
      const ids = speakers.map((s) => s._id);
      const result = await ListenerRating.deleteMany({
        teamId: { $in: ids },
        targetType: { $in: ['speaker', 'panel', 'workshop'] }
      });
      deleted = result.deletedCount || 0;
    }

    res.json({
      ...hall.toObject(),
      speakers,
      currentSpeaker: speakers[0] || null,
      deletedRatings: deleted
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/halls/:id/set-speaker — поставить конкретного спикера в эфир
router.post('/:id/set-speaker', async (req, res) => {
  try {
    const hall = await Hall.findById(req.params.id);
    if (!hall) {
      return res.status(404).json({ error: 'Hall not found' });
    }
    const { speakerId } = req.body || {};
    if (!speakerId) {
      return res.status(400).json({ error: 'speakerId is required' });
    }
    const speakers = await Team.find({ eventId: hall.eventId, type: 'speaker', hallId: hall._id })
      .sort({ order: 1, scheduledTime: 1 });
    const idx = speakers.findIndex((s) => String(s._id) === String(speakerId));
    if (idx < 0) {
      return res.status(404).json({ error: 'Speaker not found in this hall' });
    }
    hall.currentSpeakerIndex = idx;
    hall.status = 'live';
    await syncHallVoting(hall, speakers);
    await hall.save();
    res.json({
      ...hall.toObject(),
      speakers,
      currentSpeaker: speakers[idx]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

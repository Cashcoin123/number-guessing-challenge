const express = require('express');
const storage = require('../services/storage');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/game/stats
router.get('/stats', async (req, res) => {
  const data = await storage.getGameStats();

  res.json({
    ok: true,
    stats: {
      bestScore: Number(data.bestScore || 0),
      streak: Number(data.streak || 0),
      totalGames: Number(data.totalGames || 0),
      lastBonusTime: Number(data.lastBonusTime || 0),
    },
  });
});

// POST /api/game/start
router.post('/start', (req, res) => {
  const round = {
    secretNumber: Math.floor(Math.random() * 100) + 1,
    maxAttempts: 10,
    startedAt: new Date().toISOString(),
  };

  res.json({ ok: true, round });
});

// POST /api/game/guess
router.post('/guess', (req, res) => {
  const { secretNumber, guess } = req.body;

  if (secretNumber == null || guess == null) {
    return res.status(400).json({ ok: false, message: 'secretNumber and guess are required.' });
  }

  if (guess < secretNumber) {
    return res.json({ ok: true, result: 'too-low' });
  }

  if (guess > secretNumber) {
    return res.json({ ok: true, result: 'too-high' });
  }

  return res.json({ ok: true, result: 'correct' });
});

// POST /api/game/bonus
router.post('/bonus', requireAuth, async (req, res) => {
  const data = await storage.getGameStats();
  const now = Date.now();
  const bonusWindowMs = 24 * 60 * 60 * 1000;

  if (now - Number(data.lastBonusTime || 0) >= bonusWindowMs) {
    const nextStats = { ...data, lastBonusTime: now };
    await storage.saveGameStats(nextStats);

    return res.json({
      ok: true,
      granted: true,
      bonus: 50,
      nextAvailableAt: now + bonusWindowMs,
    });
  }

  return res.json({
    ok: true,
    granted: false,
    bonus: 0,
    nextAvailableAt: Number(data.lastBonusTime || 0) + bonusWindowMs,
  });
});

module.exports = router;

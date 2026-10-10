const express = require('express');

const storage = require('../services/storage');
const roundStore = require('../services/roundStore');
const { requireAuth } = require('../middleware/auth');
const { parseIntegerInRange } = require('../utils/helpers');

const router = express.Router();

const BONUS_WINDOW_MS = 24 * 60 * 60 * 1000;
const DEFAULT_BONUS = 50;

function clientRound(round) {
  return {
    roundId: round.roundId,
    maxAttempts: round.maxAttempts,
    startedAt: round.startedAt,
  };
}

// GET /api/game/stats (public, read-only)
router.get('/stats', async (req, res) => {
  const data = await storage.getGameStats();

  res.json({
    ok: true,
    stats: {
      bestScore: Number(data.bestScore || 0),
      streak: Number(data.streak || 0),
      totalGames: Number(data.totalGames || 0),
    },
  });
});

// POST /api/game/start - create a server-side round. The secret number stays on
// the server; only the round id and attempt budget are returned (ISSUE-10).
router.post('/start', (req, res) => {
  const round = roundStore.createRound();
  res.json({ ok: true, round: clientRound(round) });
});

// POST /api/game/guess - the client sends ONLY { roundId, guess }.
router.post('/guess', (req, res) => {
  const { roundId, guess } = req.body;
  const parsedGuess = parseIntegerInRange(guess, 1, 100);

  if (typeof roundId !== 'string' || !roundId) {
    return res.status(400).json({ ok: false, message: 'A valid roundId is required.' });
  }

  if (parsedGuess === null) {
    return res.status(400).json({ ok: false, message: 'guess must be an integer between 1 and 100.' });
  }

  const outcome = roundStore.submitGuess(roundId, parsedGuess);

  if (!outcome) {
    return res.status(404).json({ ok: false, message: 'Unknown or expired round. Start a new round.' });
  }

  return res.json({ ok: true, ...outcome });
});

// POST /api/game/bonus - per-user daily bonus (ISSUE-8).
router.post('/bonus', requireAuth, async (req, res) => {
  const uid = req.user && req.user.uid;

  if (!uid) {
    return res.status(401).json({ ok: false, message: 'Authentication required.' });
  }

  const now = Date.now();
  const record = await storage.getBonusRecord(uid);
  const lastClaim = Number((record && record.lastClaim) || 0);

  if (!lastClaim || now - lastClaim >= BONUS_WINDOW_MS) {
    await storage.saveBonusRecord(uid, { lastClaim: now });
    return res.json({
      ok: true,
      granted: true,
      bonus: DEFAULT_BONUS,
      nextAvailableAt: now + BONUS_WINDOW_MS,
    });
  }

  return res.json({
    ok: true,
    granted: false,
    bonus: 0,
    nextAvailableAt: lastClaim + BONUS_WINDOW_MS,
  });
});

module.exports = router;

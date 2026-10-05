const express = require('express');
const router = express.Router();

router.get('/health', (req, res) => {
  res.json({ ok: true, message: 'Game service is online.' });
});

router.post('/start', (req, res) => {
  const round = {
    secretNumber: Math.floor(Math.random() * 100) + 1,
    maxAttempts: 10,
    startedAt: new Date().toISOString(),
  };

  res.json({ ok: true, round });
});

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

router.get('/stats', (req, res) => {
  res.json({
    ok: true,
    stats: {
      bestScore: 0,
      streak: 0,
      totalGames: 0,
    },
  });
});

module.exports = router;

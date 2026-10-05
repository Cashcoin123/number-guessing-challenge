const express = require('express');
const router = express.Router();

const users = {};

router.post('/register', (req, res) => {
  const { username } = req.body;

  if (!username) {
    return res.status(400).json({ ok: false, message: 'Username is required.' });
  }

  users[username] = {
    username,
    joinedAt: new Date().toISOString(),
    score: 0,
    bestScore: 0,
    streak: 0,
  };

  return res.json({ ok: true, user: users[username] });
});

router.get('/:id', (req, res) => {
  const user = users[req.params.id];

  if (!user) {
    return res.status(404).json({ ok: false, message: 'User not found.' });
  }

  return res.json({ ok: true, user });
});

module.exports = router;

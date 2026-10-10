const express = require('express');
const storage = require('../services/storage');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// POST /api/users/register
router.post('/register', requireAuth, async (req, res) => {
  const { username } = req.body;
  if (!username) {
    return res.status(400).json({ ok: false, message: 'Username is required.' });
  }

  const users = await storage.getUsers();
  const uid = req.user?.uid || username;
  const user = users[uid] || {
    uid,
    username,
    email: req.user?.email || '',
    joinedAt: new Date().toISOString(),
    score: 0,
    bestScore: 0,
    streak: 0,
    messagesSent: 0,
  };

  const nextUser = {
    ...user,
    uid,
    username,
    email: user.email || req.user?.email || '',
    updatedAt: new Date().toISOString(),
  };

  users[uid] = nextUser;
  await storage.saveUsers(users);

  return res.json({ ok: true, user: nextUser });
});

// GET /api/users/:id
router.get('/:id', async (req, res) => {
  const users = await storage.getUsers();
  const user = users[req.params.id];

  if (!user) {
    return res.status(404).json({ ok: false, message: 'User not found.' });
  }

  return res.json({ ok: true, user });
});

module.exports = router;

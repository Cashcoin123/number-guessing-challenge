const express = require('express');
const storage = require('../services/storage');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/chat/messages
router.get('/messages', async (req, res) => {
  const messages = await storage.getChatMessages();
  res.json({ ok: true, messages: messages.slice(-20) });
});

// POST /api/chat/send
router.post('/send', requireAuth, async (req, res) => {
  const { username, message, score } = req.body;

  if (!username || !message) {
    return res.status(400).json({ ok: false, message: 'Username and message are required.' });
  }

  const messages = await storage.getChatMessages();
  const entry = {
    username,
    message,
    score: Number(score || 0),
    timestamp: new Date().toISOString(),
    userId: req.user?.uid || null,
  };

  const nextMessages = [...messages, entry].slice(-100);
  await storage.saveChatMessages(nextMessages);

  return res.json({ ok: true, message: entry });
});

module.exports = router;

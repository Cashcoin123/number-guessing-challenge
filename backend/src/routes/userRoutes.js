const express = require('express');
const router = express.Router();

const chatMessages = [
  {
    username: 'system',
    message: 'Welcome to the global chat room.',
    timestamp: new Date().toISOString(),
  },
];

router.get('/messages', (req, res) => {
  res.json({ ok: true, messages: chatMessages.slice(-20) });
});

router.post('/send', (req, res) => {
  const { username, message } = req.body;

  if (!username || !message) {
    return res.status(400).json({ ok: false, message: 'Username and message are required.' });
  }

  const entry = {
    username,
    message,
    timestamp: new Date().toISOString(),
  };

  chatMessages.push(entry);

  return res.json({ ok: true, message: entry });
});

module.exports = router;

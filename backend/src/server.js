require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const storage = require('./services/storage');
const { requireAuth } = require('./middleware/auth');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    message: 'API is running.',
    timestamp: new Date().toISOString(),
    authMode: process.env.ENABLE_AUTH === 'true' ? 'enabled' : 'disabled',
  });
});

app.get('/api/game/stats', async (req, res) => {
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

app.post('/api/game/start', (req, res) => {
  const round = {
    secretNumber: Math.floor(Math.random() * 100) + 1,
    maxAttempts: 10,
    startedAt: new Date().toISOString(),
  };

  res.json({ ok: true, round });
});

app.post('/api/game/guess', (req, res) => {
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

app.post('/api/game/bonus', requireAuth, async (req, res) => {
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

app.get('/api/chat/messages', async (req, res) => {
  const messages = await storage.getChatMessages();
  res.json({ ok: true, messages: messages.slice(-20) });
});

app.post('/api/chat/send', requireAuth, async (req, res) => {
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
  io.to('global-chat').emit('chat-message', entry);

  return res.json({ ok: true, message: entry });
});

app.post('/api/users/register', requireAuth, async (req, res) => {
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

app.get('/api/users/:id', async (req, res) => {
  const users = await storage.getUsers();
  const user = users[req.params.id];

  if (!user) {
    return res.status(404).json({ ok: false, message: 'User not found.' });
  }

  return res.json({ ok: true, user });
});

app.get('/api/leaderboard', async (req, res) => {
  const users = await storage.getUsers();
  const leaderboard = Object.values(users)
    .sort((a, b) => (b.bestScore || 0) - (a.bestScore || 0))
    .slice(0, 50)
    .map((user, index) => ({
      rank: index + 1,
      username: user.username,
      bestScore: user.bestScore || 0,
      streak: user.streak || 0,
      messagesSent: user.messagesSent || 0,
    }));

  res.json({ ok: true, leaderboard });
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join-chat', (username) => {
    socket.join('global-chat');
    io.to('global-chat').emit('chat-message', {
      username,
      message: `${username} joined the chat room.`,
      timestamp: new Date().toISOString(),
      system: true,
    });
  });

  socket.on('send-message', (payload) => {
    io.to('global-chat').emit('chat-message', payload);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
});

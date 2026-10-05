require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const fs = require('fs');
const path = require('path');
const { initFirebase } = require('./config/firebase');
const storage = require('./services/storage');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

const PORT = process.env.PORT || 5000;
const DATA_DIR = path.resolve(__dirname, '../data');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const GAME_FILE = path.join(DATA_DIR, 'game_data.json');
const CHAT_FILE = path.join(DATA_DIR, 'chat_messages.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const LEADERBOARD_FILE = path.join(DATA_DIR, 'leaderboard.json');

const defaultGameData = {
  bestScore: 0,
  streak: 0,
  totalGames: 0,
  lastBonusTime: 0,
};

if (!fs.existsSync(GAME_FILE)) {
  fs.writeFileSync(GAME_FILE, JSON.stringify(defaultGameData, null, 2), 'utf8');
}
if (!fs.existsSync(CHAT_FILE)) {
  fs.writeFileSync(CHAT_FILE, JSON.stringify([], null, 2), 'utf8');
}
if (!fs.existsSync(USERS_FILE)) {
  fs.writeFileSync(USERS_FILE, JSON.stringify({}, null, 2), 'utf8');
}
if (!fs.existsSync(LEADERBOARD_FILE)) {
  fs.writeFileSync(LEADERBOARD_FILE, JSON.stringify([], null, 2), 'utf8');
}

app.use(cors());
app.use(express.json());

const firebaseDb = initFirebase();

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    message: 'API is running.',
    timestamp: new Date().toISOString(),
    backend: process.env.USE_FIREBASE === 'true' ? 'firebase' : 'local-json',
  });
});

app.get('/api/game/stats', (req, res) => {
  const data = storage.getGameStats();
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

app.post('/api/game/bonus', (req, res) => {
  const data = storage.getGameStats();
  const now = Date.now();
  const bonusWindowMs = 24 * 60 * 60 * 1000;

  if (now - Number(data.lastBonusTime || 0) >= bonusWindowMs) {
    data.lastBonusTime = now;
    storage.saveGameStats(data);
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

app.get('/api/chat/messages', (req, res) => {
  const messages = storage.getChatMessages();
  res.json({ ok: true, messages: messages.slice(-20) });
});

app.post('/api/chat/send', (req, res) => {
  const { username, message, score } = req.body;

  if (!username || !message) {
    return res.status(400).json({ ok: false, message: 'Username and message are required.' });
  }

  const messages = storage.getChatMessages();
  const entry = {
    username,
    message,
    score: Number(score || 0),
    timestamp: new Date().toISOString(),
  };

  messages.push(entry);
  storage.saveChatMessages(messages.slice(-100));

  io.to('global-chat').emit('chat-message', entry);

  return res.json({ ok: true, message: entry });
});

app.post('/api/users/register', (req, res) => {
  const { username } = req.body;

  if (!username) {
    return res.status(400).json({ ok: false, message: 'Username is required.' });
  }

  const users = storage.getUsers();
  const user = users[username] || {
    username,
    joinedAt: new Date().toISOString(),
    score: 0,
    bestScore: 0,
    streak: 0,
    messagesSent: 0,
  };

  users[username] = user;
  storage.saveUsers(users);

  return res.json({ ok: true, user });
});

app.get('/api/users/:id', (req, res) => {
  const users = storage.getUsers();
  const user = users[req.params.id];

  if (!user) {
    return res.status(404).json({ ok: false, message: 'User not found.' });
  }

  return res.json({ ok: true, user });
});

app.get('/api/leaderboard', (req, res) => {
  const users = storage.getUsers();
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
  if (firebaseDb) {
    console.log('🔥 Firebase connected');
  }
});

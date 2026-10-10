require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const storage = require('./services/storage');
const gameRoutes = require('./routes/gameRoutes');
const chatRoutes = require('./routes/chatRoutes');
const userRoutes = require('./routes/userRoutes');

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

app.use('/api/game', gameRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/users', userRoutes);

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

// Expose the Socket.IO instance so route handlers can broadcast realtime events.
app.set('io', io);

server.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
});

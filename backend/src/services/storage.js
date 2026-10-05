const fs = require('fs');
const path = require('path');
const { initFirebase } = require('../config/firebase');

const DATA_DIR = path.resolve(__dirname, '../../data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const CHAT_FILE = path.join(DATA_DIR, 'chat_messages.json');
const LEADERBOARD_FILE = path.join(DATA_DIR, 'leaderboard.json');
const GAME_FILE = path.join(DATA_DIR, 'game_data.json');
const USE_FIREBASE = process.env.USE_FIREBASE === 'true';
const db = USE_FIREBASE ? initFirebase() : null;

function ensureFile(filePath, defaultValue = []) {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaultValue, null, 2), 'utf8');
  }
}

ensureFile(USERS_FILE, {});
ensureFile(CHAT_FILE, []);
ensureFile(LEADERBOARD_FILE, []);
ensureFile(GAME_FILE, {
  bestScore: 0,
  streak: 0,
  totalGames: 0,
  lastBonusTime: 0,
});

function readJson(filePath, fallback) {
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    return raw ? JSON.parse(raw) : fallback;
  } catch (error) {
    return fallback;
  }
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

async function getUsers() {
  if (USE_FIREBASE && db) {
    const snapshot = await db.collection('users').get();
    const users = {};
    snapshot.forEach((doc) => {
      users[doc.id] = doc.data();
    });
    return users;
  }

  return readJson(USERS_FILE, {});
}

async function saveUsers(users) {
  if (USE_FIREBASE && db) {
    const batch = db.batch();
    Object.entries(users).forEach(([key, value]) => {
      const ref = db.collection('users').doc(key);
      batch.set(ref, value);
    });
    await batch.commit();
    return;
  }

  writeJson(USERS_FILE, users);
}

async function getChatMessages() {
  if (USE_FIREBASE && db) {
    const snapshot = await db.collection('chat_messages').orderBy('timestamp', 'asc').limit(20).get();
    return snapshot.docs.map((doc) => doc.data());
  }

  return readJson(CHAT_FILE, []);
}

async function saveChatMessages(messages) {
  if (USE_FIREBASE && db) {
    const batch = db.batch();
    messages.slice(-100).forEach((entry, index) => {
      const id = entry.id || `${entry.username}-${entry.timestamp || index}`;
      batch.set(db.collection('chat_messages').doc(id), { ...entry, id });
    });
    await batch.commit();
    return;
  }

  writeJson(CHAT_FILE, messages);
}

async function getLeaderboard() {
  if (USE_FIREBASE && db) {
    const snapshot = await db.collection('leaderboard').orderBy('bestScore', 'desc').limit(50).get();
    return snapshot.docs.map((doc) => doc.data());
  }

  return readJson(LEADERBOARD_FILE, []);
}

async function saveLeaderboard(entries) {
  if (USE_FIREBASE && db) {
    const batch = db.batch();
    entries.slice(0, 50).forEach((entry, index) => {
      batch.set(db.collection('leaderboard').doc(String(index + 1)), entry);
    });
    await batch.commit();
    return;
  }

  writeJson(LEADERBOARD_FILE, entries);
}

async function getGameStats() {
  if (USE_FIREBASE && db) {
    const doc = await db.collection('game').doc('stats').get();
    return doc.exists ? doc.data() : {
      bestScore: 0,
      streak: 0,
      totalGames: 0,
      lastBonusTime: 0,
    };
  }

  return readJson(GAME_FILE, {
    bestScore: 0,
    streak: 0,
    totalGames: 0,
    lastBonusTime: 0,
  });
}

async function saveGameStats(data) {
  if (USE_FIREBASE && db) {
    await db.collection('game').doc('stats').set(data, { merge: true });
    return;
  }

  writeJson(GAME_FILE, data);
}

module.exports = {
  ensureFile,
  getUsers,
  saveUsers,
  getChatMessages,
  saveChatMessages,
  getLeaderboard,
  saveLeaderboard,
  getGameStats,
  saveGameStats,
};

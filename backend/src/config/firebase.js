const fs = require('fs');
const path = require('path');

const DATA_DIR = path.resolve(__dirname, '../../data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const CHAT_FILE = path.join(DATA_DIR, 'chat_messages.json');
const LEADERBOARD_FILE = path.join(DATA_DIR, 'leaderboard.json');
const GAME_FILE = path.join(DATA_DIR, 'game_data.json');

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

function getUsers() {
  return readJson(USERS_FILE, {});
}

function saveUsers(users) {
  writeJson(USERS_FILE, users);
}

function getChatMessages() {
  return readJson(CHAT_FILE, []);
}

function saveChatMessages(messages) {
  writeJson(CHAT_FILE, messages);
}

function getLeaderboard() {
  return readJson(LEADERBOARD_FILE, []);
}

function saveLeaderboard(entries) {
  writeJson(LEADERBOARD_FILE, entries);
}

function getGameStats() {
  return readJson(GAME_FILE, {
    bestScore: 0,
    streak: 0,
    totalGames: 0,
    lastBonusTime: 0,
  });
}

function saveGameStats(data) {
  writeJson(GAME_FILE, data);
}

module.exports = {
  getUsers,
  saveUsers,
  getChatMessages,
  saveChatMessages,
  getLeaderboard,
  saveLeaderboard,
  getGameStats,
  saveGameStats,
};

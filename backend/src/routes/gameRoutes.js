const path = require('path');

module.exports = {
  appName: 'number-guessing-challenge',
  baseDir: path.resolve(__dirname, '../../'),
  dataFile: path.resolve(__dirname, '../../data/game_data.json'),
  chatFile: path.resolve(__dirname, '../../data/chat_messages.json'),
  userFile: path.resolve(__dirname, '../../data/users.json'),
};

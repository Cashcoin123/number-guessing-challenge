# API Documentation

## Base URL
```
http://localhost:5000/api
```

## Game Routes

### Get Game Stats
```
GET /game/stats

Response:
{
  "ok": true,
  "stats": {
    "bestScore": 1200,
    "streak": 5,
    "totalGames": 42,
    "lastBonusTime": 1695916800000
  }
}
```

### Start New Round
```
POST /game/start

Response:
{
  "ok": true,
  "round": {
    "secretNumber": 42,
    "maxAttempts": 10,
    "startedAt": "2024-01-01T12:00:00.000Z"
  }
}
```

### Submit Guess
```
POST /game/guess

Body:
{
  "secretNumber": 42,
  "guess": 50
}

Response:
{
  "ok": true,
  "result": "too-high" | "too-low" | "correct"
}
```

### Claim Daily Bonus
```
POST /game/bonus

Response:
{
  "ok": true,
  "granted": true,
  "bonus": 50,
  "nextAvailableAt": 1695916800000
}
```

## Chat Routes

### Get Chat Messages
```
GET /chat/messages

Response:
{
  "ok": true,
  "messages": [
    {
      "username": "Player1",
      "message": "Just won 100 points!",
      "score": 100,
      "timestamp": "2024-01-01T12:00:00.000Z"
    }
  ]
}
```

### Send Chat Message
```
POST /chat/send

Body:
{
  "username": "Player1",
  "message": "Great game!",
  "score": 150
}

Response:
{
  "ok": true,
  "message": {
    "username": "Player1",
    "message": "Great game!",
    "score": 150,
    "timestamp": "2024-01-01T12:00:00.000Z"
  }
}
```

## User Routes

### Register User
```
POST /users/register

Body:
{
  "username": "Player1"
}

Response:
{
  "ok": true,
  "user": {
    "username": "Player1",
    "joinedAt": "2024-01-01T12:00:00.000Z",
    "score": 0,
    "bestScore": 0,
    "streak": 0,
    "messagesSent": 0
  }
}
```

### Get User Profile
```
GET /users/:id

Response:
{
  "ok": true,
  "user": {
    "username": "Player1",
    "joinedAt": "2024-01-01T12:00:00.000Z",
    "score": 500,
    "bestScore": 1200,
    "streak": 5,
    "messagesSent": 23
  }
}
```

## Leaderboard Routes

### Get Global Leaderboard
```
GET /leaderboard

Response:
{
  "ok": true,
  "leaderboard": [
    {
      "rank": 1,
      "username": "TopPlayer",
      "bestScore": 5000,
      "streak": 15,
      "messagesSent": 45
    },
    {
      "rank": 2,
      "username": "Player1",
      "bestScore": 3500,
      "streak": 8,
      "messagesSent": 23
    }
  ]
}
```

## WebSocket Events

### Join Chat
```javascript
socket.emit('join-chat', 'username');

socket.on('chat-message', (message) => {
  console.log(message);
});
```

### Send Message
```javascript
socket.emit('send-message', {
  username: 'Player1',
  message: 'Hello everyone!',
  timestamp: new Date().toISOString()
});
```

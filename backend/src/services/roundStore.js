const crypto = require('crypto');

// Server-side game rounds. The secret number never leaves the process, so the
// client can no longer supply it and win by construction (ISSUE-10).
//
// Rounds are intentionally kept in memory: they are short-lived play sessions,
// and keeping them out of the JSON storage layer avoids whole-file
// read-modify-write races between concurrent players.

const DEFAULT_MAX_ATTEMPTS = 10;
const ROUND_TTL_MS = 30 * 60 * 1000; // a round expires 30 minutes after it starts
const MAX_TRACKED_ROUNDS = 10000;

const rounds = new Map();

function sweepExpired(now) {
  for (const [id, round] of rounds) {
    if (now - round.startedAtMs > ROUND_TTL_MS) {
      rounds.delete(id);
    }
  }
  // Hard cap so a flood of abandoned rounds cannot grow memory without bound.
  if (rounds.size > MAX_TRACKED_ROUNDS) {
    const excess = rounds.size - MAX_TRACKED_ROUNDS;
    let removed = 0;
    for (const id of rounds.keys()) {
      rounds.delete(id);
      if (++removed >= excess) break;
    }
  }
}

function createRound(options = {}) {
  const now = Date.now();
  sweepExpired(now);

  const maxAttempts = Number.isInteger(options.maxAttempts)
    ? options.maxAttempts
    : DEFAULT_MAX_ATTEMPTS;

  const round = {
    id: crypto.randomUUID(),
    secretNumber: crypto.randomInt(1, 101), // 1..100 inclusive
    maxAttempts,
    attempts: 0,
    startedAtMs: now,
    finished: false,
  };

  rounds.set(round.id, round);

  return {
    roundId: round.id,
    maxAttempts: round.maxAttempts,
    startedAt: new Date(now).toISOString(),
  };
}

/**
 * Evaluate a guess against the server-held round.
 * Returns null when the round id is unknown or expired.
 */
function submitGuess(roundId, guess) {
  const now = Date.now();
  const round = rounds.get(roundId);

  if (!round || now - round.startedAtMs > ROUND_TTL_MS) {
    if (round) rounds.delete(roundId);
    return null;
  }

  if (round.finished) {
    return {
      result: 'round-over',
      attempts: round.attempts,
      maxAttempts: round.maxAttempts,
      remaining: 0,
    };
  }

  round.attempts += 1;

  let result;
  if (guess === round.secretNumber) {
    result = 'correct';
    round.finished = true;
  } else if (guess < round.secretNumber) {
    result = 'too-low';
  } else {
    result = 'too-high';
  }

  const outOfAttempts = !round.finished && round.attempts >= round.maxAttempts;
  if (outOfAttempts) {
    round.finished = true;
  }

  const response = {
    result: outOfAttempts && result !== 'correct' ? 'round-over' : result,
    attempts: round.attempts,
    maxAttempts: round.maxAttempts,
    remaining: Math.max(0, round.maxAttempts - round.attempts),
  };

  if (result === 'correct') {
    response.secretNumber = round.secretNumber;
  } else if (outOfAttempts) {
    response.secretNumber = round.secretNumber;
  }

  return response;
}

function _resetForTests() {
  rounds.clear();
}

module.exports = {
  DEFAULT_MAX_ATTEMPTS,
  ROUND_TTL_MS,
  createRound,
  submitGuess,
  _resetForTests,
};

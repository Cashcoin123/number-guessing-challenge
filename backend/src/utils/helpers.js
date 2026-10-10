// Shared validation and formatting helpers for the Number Guessing Challenge API.

const MAX_MESSAGE_LENGTH = 280;
const MAX_USERNAME_LENGTH = 32;

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

// Parse a value that is expected to be an integer within an inclusive range.
// Returns null when the value is not a usable integer.
function parseIntegerInRange(value, min, max) {
  const parsed = typeof value === 'number' ? value : Number(value);

  if (!Number.isInteger(parsed)) {
    return null;
  }

  if (parsed < min || parsed > max) {
    return null;
  }

  return parsed;
}

// Normalise a player-supplied username: trim, collapse whitespace and bound length.
function normaliseUsername(value) {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim().replace(/\s+/g, ' ');

  if (!trimmed) {
    return null;
  }

  return trimmed.slice(0, MAX_USERNAME_LENGTH);
}

// Bound and trim a chat message.
function normaliseMessage(value) {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  return trimmed.slice(0, MAX_MESSAGE_LENGTH);
}

function createResponse(ok, payload = {}) {
  return { ok, ...payload };
}

module.exports = {
  MAX_MESSAGE_LENGTH,
  MAX_USERNAME_LENGTH,
  isNonEmptyString,
  parseIntegerInRange,
  normaliseUsername,
  normaliseMessage,
  createResponse,
};

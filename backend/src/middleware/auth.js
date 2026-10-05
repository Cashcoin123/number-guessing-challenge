const admin = require('firebase-admin');

async function verifyToken(token) {
  if (!token) {
    return null;
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    return null;
  }
}

async function requireAuth(req, res, next) {
  if (process.env.ENABLE_AUTH !== 'true') {
    req.user = {
      uid: 'local-dev-user',
      email: 'local@dev.local',
      username: 'local-user',
    };
    return next();
  }

  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ ok: false, message: 'Authentication required.' });
  }

  const decoded = await verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ ok: false, message: 'Invalid or expired token.' });
  }

  req.user = decoded;
  return next();
}

module.exports = {
  verifyToken,
  requireAuth,
};

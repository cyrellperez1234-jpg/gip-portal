const Database = require('better-sqlite3');

const db = new Database('gip_portal.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    google_id TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    photo_url TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);

function findUserByGoogleId(googleId) {
  return db.prepare('SELECT * FROM users WHERE google_id = ?').get(googleId);
}

function findUserById(id) {
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id);
}

function createOrUpdateUser(profile) {
  const googleId = profile.id;
  const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
  const name = profile.displayName || 'Unknown User';
  const photoUrl = profile.photos && profile.photos[0] ? profile.photos[0].value : null;

  if (!email) {
    throw new Error('Google account does not have an email address.');
  }

  const existingUser = findUserByGoogleId(googleId);

  if (existingUser) {
    db.prepare(
      'UPDATE users SET email = ?, name = ?, photo_url = ? WHERE google_id = ?'
    ).run(email, name, photoUrl, googleId);

    return findUserByGoogleId(googleId);
  }

  db.prepare(
    'INSERT INTO users (google_id, email, name, photo_url) VALUES (?, ?, ?, ?)'
  ).run(googleId, email, name, photoUrl);

  return findUserByGoogleId(googleId);
}

module.exports = {
  createOrUpdateUser,
  findUserById,
};

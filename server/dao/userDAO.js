import db from '../db.js';
import { scryptSync, timingSafeEqual } from 'crypto';

export function getUserById(id) {
  const user = db.prepare('SELECT id, username FROM users WHERE id = ?').get(id);
  return user;
}

export function getUser(username, password) {
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user) return null;

  const hashedInput = scryptSync(password, user.salt, 32);
  const storedHash = Buffer.from(user.password, 'hex');

  const match = timingSafeEqual(hashedInput, storedHash);
  if (!match) return null;

  return { id: user.id, username: user.username };
}



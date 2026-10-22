import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import {
  createUser,
  findUserByEmail,
  findUserById
} from '../repositories/user.repository.js';

const passwordRounds = 12;

export function requireAuthConfiguration() {
  if (!env.jwtSecret || env.jwtSecret.length < 32) {
    const error = new Error('JWT_SECRET must contain at least 32 characters.');
    error.statusCode = 503;
    throw error;
  }
}

export function normalizeEmail(email) {
  return typeof email === 'string' ? email.trim().toLowerCase() : '';
}

export async function registerUser(email, password) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    const error = new Error('A valid email address is required.');
    error.statusCode = 400;
    throw error;
  }
  if (typeof password !== 'string' || password.length < 8) {
    const error = new Error('Password must contain at least 8 characters.');
    error.statusCode = 400;
    throw error;
  }
  if (await findUserByEmail(normalizedEmail)) {
    const error = new Error('An account with that email already exists.');
    error.statusCode = 409;
    throw error;
  }

  const passwordHash = await bcrypt.hash(password, passwordRounds);
  return createUser(normalizedEmail, passwordHash);
}

export async function authenticateUser(email, password) {
  const user = await findUserByEmail(normalizeEmail(email));
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    const error = new Error('Invalid email or password.');
    error.statusCode = 401;
    throw error;
  }
  return user;
}

export function createToken(user) {
  requireAuthConfiguration();
  return jwt.sign({ sub: user.id }, env.jwtSecret, { expiresIn: '1d' });
}

export async function verifyToken(token) {
  requireAuthConfiguration();
  const payload = jwt.verify(token, env.jwtSecret);
  if (typeof payload !== 'object' || typeof payload.sub !== 'string') {
    throw new Error('Invalid authentication token.');
  }
  return findUserById(payload.sub);
}

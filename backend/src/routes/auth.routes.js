import { Router } from 'express';
import { env } from '../config/env.js';
import {
  authenticateUser,
  createToken,
  registerUser,
  requireAuthConfiguration
} from '../services/auth.service.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const authRouter = Router();
const cookieOptions = {
  httpOnly: true,
  sameSite: env.nodeEnv === 'production' ? 'none' : 'lax',
  secure: env.nodeEnv === 'production',
  maxAge: env.authCookieMaxAgeMs
};

function publicUser(user) {
  return { id: user.id, email: user.email, created_at: user.created_at };
}

function setAuthCookie(response, user) {
  response.cookie(env.authCookieName, createToken(user), cookieOptions);
}

authRouter.post('/register', async (request, response, next) => {
  try {
    requireAuthConfiguration();
    const user = await registerUser(request.body?.email, request.body?.password);
    setAuthCookie(response, user);
    response.status(201).json({ status: 'ok', data: { user: publicUser(user) } });
  } catch (error) {
    next(error);
  }
});

authRouter.post('/login', async (request, response, next) => {
  try {
    requireAuthConfiguration();
    const user = await authenticateUser(request.body?.email, request.body?.password);
    setAuthCookie(response, user);
    response.json({ status: 'ok', data: { user: publicUser(user) } });
  } catch (error) {
    next(error);
  }
});

authRouter.post('/logout', (_request, response) => {
  response.clearCookie(env.authCookieName, cookieOptions);
  response.json({ status: 'ok', data: { logged_out: true } });
});

authRouter.get('/me', requireAuth, (request, response) => {
  response.json({ status: 'ok', data: { user: publicUser(request.user) } });
});

export default authRouter;

import { env } from '../config/env.js';
import { verifyToken } from '../services/auth.service.js';

export async function requireAuth(request, response, next) {
  const token = request.cookies?.[env.authCookieName];
  if (!token) {
    response.status(401).json({ status: 'error', message: 'Authentication required.' });
    return;
  }

  try {
    const user = await verifyToken(token);
    if (!user) {
      response.status(401).json({ status: 'error', message: 'Authentication required.' });
      return;
    }
    request.user = user;
    next();
  } catch (_error) {
    response.status(401).json({ status: 'error', message: 'Authentication required.' });
  }
}

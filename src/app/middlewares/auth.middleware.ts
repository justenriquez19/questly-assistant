import { Request, Response, NextFunction } from 'express';

import { JwtUtil } from '../utils/jwt.util';

/**
 * @description Middleware for JWT authentication and user access validation.
 */
export class AuthMiddleware {
  /**
   * @description Verifies JWT and ensures users can only access their own bot unless they are admins.
   */
  public static verifyUserSession(req: Request, res: Response, next: NextFunction): void {
    try {
      const token: string | undefined = req.headers.authorization?.split(' ')[1] || req.query.token as string;

      if (!token) {
        res.status(401).json({ error: 'Unauthorized: No token provided' });

        return;
      }

      const decoded = JwtUtil.verifyToken(token);
      const requestedPhone: string = req.params.phone;

      if (decoded.isAdmin || decoded.phone === requestedPhone) {
        req.user = decoded;
        next();

        return;
      }

      res.status(403).json({ error: 'Forbidden: You can only manage your own WhatsApp bot' });
    } catch (error) {
      res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }
  }
}

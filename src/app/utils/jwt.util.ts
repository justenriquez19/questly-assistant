import jwt from 'jsonwebtoken';

import { TokenPayload } from '../shared/interfaces/session.interfaces';

const JWT_SECRET: string = process.env.JWT_SECRET || 'supersecreto';

/**
 * @description Utility functions for handling JWT operations.
 */
export class JwtUtil {
  /**
   * @description Generates a signed JWT for a user.
   * @param {string} phone - User's phone number.
   * @param {boolean} [isAdmin=false] - Indicates if the user has admin privileges.
   * @returns {string} - Signed JWT token.
   */
  public static generateToken(phone: string, isAdmin: boolean = false): string {
    return jwt.sign({ phone, isAdmin }, JWT_SECRET, { expiresIn: '24h' });
  }

  /**
   * @description Verifies and decodes a JWT token.
   * @param {string} token - JWT token to verify.
   * @returns {TokenPayload} - Decoded payload.
   * @throws {Error} - If the token is invalid or expired.
   */
  public static verifyToken(token: string): TokenPayload {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  }
}

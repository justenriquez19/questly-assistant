import { Request, Response } from 'express';
import { JwtUtil } from '../utils/jwt.util';

/**
 * @description Handles authentication-related operations.
 */
export class AuthController {
  private secretKey: string;

  constructor() {
    this.secretKey = process.env.MASTER_KEY || 'defaultSecret';
  }

  /**
   * @description Generates a JWT token for an admin user.
   */
  public generateAdminToken(req: Request, res: Response): void {
    const { secret } = req.body;

    if (secret !== this.secretKey) {
      res.status(403).json({ error: 'Forbidden: Invalid secret key' });
      return;
    }

    const token: string = JwtUtil.generateToken('admin', true);
    res.json({ token });
  }
}

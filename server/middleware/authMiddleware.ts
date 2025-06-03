import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    // You can add other properties from the JWT payload if needed
  };
}

export const protectRoute = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7, authHeader.length); // Extract token after "Bearer "
    const jwtSecret = process.env.SUPABASE_JWT_SECRET;

    if (!jwtSecret) {
      console.error('SUPABASE_JWT_SECRET is not defined.');
      return res.status(500).json({ message: 'Internal server error: JWT secret not configured.' });
    }

    try {
      const decoded = jwt.verify(token, jwtSecret);
      // Supabase JWT 'sub' claim usually holds the user ID
      // The payload structure might vary slightly, inspect a token if unsure
      if (typeof decoded === 'object' && decoded.sub) {
        req.user = { id: decoded.sub as string };
        next();
      } else {
        console.warn('JWT decoded successfully but "sub" (user ID) was not found.');
        return res.status(401).json({ message: 'Invalid token: User ID missing.' });
      }
    } catch (error) {
      console.error('JWT verification error:', error);
      return res.status(401).json({ message: 'Unauthorized: Invalid or expired token.' });
    }
  } else {
    return res.status(401).json({ message: 'Unauthorized: No token provided.' });
  }
}; 
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    // You can add other properties from the JWT payload if needed
  };
}

export const protectRoute = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  console.log('🔐 [AUTH_MIDDLEWARE] protectRoute called');
  
  const authHeader = req.headers.authorization;
  console.log('🔐 [AUTH_MIDDLEWARE] authHeader:', authHeader ? `Bearer ${authHeader.substring(7, 20)}...` : 'MISSING');

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7, authHeader.length); // Extract token after "Bearer "
    console.log('🔐 [AUTH_MIDDLEWARE] Token extracted, length:', token.length);
    console.log('🔐 [AUTH_MIDDLEWARE] Token preview:', token.substring(0, 20) + '...' + token.substring(token.length - 20));
    
    const jwtSecret = process.env.SUPABASE_JWT_SECRET;

    if (!jwtSecret) {
      console.error('🔐 [AUTH_MIDDLEWARE] CRITICAL: SUPABASE_JWT_SECRET is not defined.');
      return res.status(500).json({ message: 'Internal server error: JWT secret not configured.' });
    }

    try {
      console.log('🔐 [AUTH_MIDDLEWARE] Attempting JWT verification...');
      const decoded = jwt.verify(token, jwtSecret);
      console.log('🔐 [AUTH_MIDDLEWARE] JWT verification successful. Decoded payload type:', typeof decoded);
      
      if (typeof decoded === 'object' && decoded !== null) {
        console.log('🔐 [AUTH_MIDDLEWARE] Decoded JWT payload keys:', Object.keys(decoded));
        console.log('🔐 [AUTH_MIDDLEWARE] JWT sub (user ID):', (decoded as any).sub);
        console.log('🔐 [AUTH_MIDDLEWARE] JWT aud (audience):', (decoded as any).aud);
        console.log('🔐 [AUTH_MIDDLEWARE] JWT iss (issuer):', (decoded as any).iss);
        console.log('🔐 [AUTH_MIDDLEWARE] JWT exp (expires):', (decoded as any).exp);
        console.log('🔐 [AUTH_MIDDLEWARE] JWT iat (issued at):', (decoded as any).iat);
      }
      
      // Supabase JWT 'sub' claim usually holds the user ID
      // The payload structure might vary slightly, inspect a token if unsure
      if (typeof decoded === 'object' && decoded && (decoded as any).sub) {
        const extractedUserId = (decoded as any).sub as string;
        console.log('🔐 [AUTH_MIDDLEWARE] ✅ Successfully extracted user ID:', extractedUserId);
        
        req.user = { id: extractedUserId };
        console.log('🔐 [AUTH_MIDDLEWARE] ✅ Set req.user.id to:', req.user.id);
        
        next();
      } else {
        console.warn('🔐 [AUTH_MIDDLEWARE] ❌ JWT decoded successfully but "sub" (user ID) was not found.');
        console.warn('🔐 [AUTH_MIDDLEWARE] ❌ Decoded object:', decoded);
        return res.status(401).json({ message: 'Invalid token: User ID missing.' });
      }
    } catch (error) {
      console.error('🔐 [AUTH_MIDDLEWARE] ❌ JWT verification error:', error);
      if (error instanceof jwt.JsonWebTokenError) {
        console.error('🔐 [AUTH_MIDDLEWARE] ❌ JWT Error type:', error.name);
        console.error('🔐 [AUTH_MIDDLEWARE] ❌ JWT Error message:', error.message);
      }
      return res.status(401).json({ message: 'Unauthorized: Invalid or expired token.' });
    }
  } else {
    console.error('🔐 [AUTH_MIDDLEWARE] ❌ No Bearer token provided');
    return res.status(401).json({ message: 'Unauthorized: No token provided.' });
  }
}; 
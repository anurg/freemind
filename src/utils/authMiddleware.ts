import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface AuthenticatedRequest extends NextApiRequest {
  user?: any;
}

type Handler = (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void | NextApiResponse>;

export function withAuth(handler: Handler, requiredRoles: string[] = []) {
  return async (req: AuthenticatedRequest, res: NextApiResponse) => {
    try {
      // Get token from Authorization header
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Unauthorized: Missing or invalid token format' });
      }

      const token = authHeader.split(' ')[1];
      if (!token) {
        return res.status(401).json({ message: 'Unauthorized: No token provided' });
      }

      // Verify token
      const decoded = jwt.verify(
        token, 
        process.env.JWT_SECRET || 'your-super-secret-jwt-key-for-freemind-app'
      ) as any;

      console.log('Decoded token:', decoded);

      // Check if user exists and is active
      const userId = decoded.id || decoded.userId;
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized: Invalid token structure' });
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user || !user.isActive) {
        return res.status(401).json({ message: 'Unauthorized: User not found or inactive' });
      }

      // Check if user has required role
      const userRole = decoded.role;
      if (requiredRoles.length > 0 && !requiredRoles.includes(userRole)) {
        return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
      }

      // Add user data to request
      req.user = {
        id: userId,
        email: user.email,
        role: user.role
      };

      // Call the original handler
      return handler(req, res);
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        return res.status(401).json({ message: 'Unauthorized: Invalid token' });
      }
      
      console.error('Auth middleware error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    } finally {
      await prisma.$disconnect();
    }
  };
}

// Export the authMiddleware function for backward compatibility
export const authMiddleware = (handler: Handler) => withAuth(handler, []);

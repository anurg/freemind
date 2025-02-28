import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

type ResponseData = {
  token?: string;
  user?: any;
  message?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Check for default admin account
    if (email === 'admin@freemind.com' && password === 'admin') {
      // Check if admin account already exists
      const existingAdmin = await prisma.user.findUnique({
        where: { email: 'admin@freemind.com' }
      });

      // If admin doesn't exist, create it
      if (!existingAdmin) {
        const hashedPassword = await bcrypt.hash('admin', 10);
        await prisma.user.create({
          data: {
            username: 'admin',
            email: 'admin@freemind.com',
            password: hashedPassword,
            role: 'ADMIN',
          },
        });
      }

      // Generate token for admin
      const token = jwt.sign(
        { 
          userId: existingAdmin?.id || 'admin-id', 
          email: 'admin@freemind.com',
          role: 'ADMIN' 
        },
        process.env.JWT_SECRET || 'your-super-secret-jwt-key-for-freemind-app',
        { expiresIn: '8h' }
      );

      return res.status(200).json({
        token,
        user: {
          id: existingAdmin?.id || 'admin-id',
          username: 'admin',
          email: 'admin@freemind.com',
          role: 'ADMIN',
        },
      });
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Check if user exists and is active
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Invalid credentials or account is inactive' });
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'your-super-secret-jwt-key-for-freemind-app',
      { expiresIn: '8h' }
    );

    // Log the login action
    await prisma.auditLog.create({
      data: {
        action: 'LOGIN',
        entity: 'USER',
        entityId: user.id,
        userId: user.id,
        details: `User ${user.username} logged in`,
      },
    });

    // Return token and user data
    return res.status(200).json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
}

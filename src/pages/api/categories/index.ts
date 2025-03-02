import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../../../utils/authMiddleware';

const prisma = new PrismaClient();

async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Get the authenticated user from the middleware
  const user = req.user;
  
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized: Authentication required' });
  }

  // GET - Fetch all categories
  if (req.method === 'GET') {
    try {
      const categories = await prisma.category.findMany({
        orderBy: {
          name: 'asc'
        }
      });
      
      return res.status(200).json(categories);
    } catch (error) {
      console.error('Error fetching categories:', error);
      return res.status(500).json({ error: 'Failed to fetch categories' });
    }
  } 
  // POST - Create a new category
  else if (req.method === 'POST') {
    try {
      const { name, description } = req.body;
      
      if (!name || name.trim() === '') {
        return res.status(400).json({ error: 'Category name is required' });
      }
      
      // Check if category with the same name already exists
      const existingCategory = await prisma.category.findUnique({
        where: { name: name.trim() }
      });
      
      if (existingCategory) {
        return res.status(400).json({ error: 'A category with this name already exists' });
      }
      
      // Create the new category
      const category = await prisma.category.create({
        data: {
          name: name.trim(),
          description: description || null
        }
      });
      
      // Log the action
      await prisma.auditLog.create({
        data: {
          action: 'CREATE',
          entity: 'Category',
          entityId: category.id,
          userId: user.id,
          details: `Created category: ${category.name}`
        }
      });
      
      return res.status(201).json(category);
    } catch (error) {
      console.error('Error creating category:', error);
      return res.status(500).json({ error: 'Failed to create category' });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

export default authMiddleware(handler);

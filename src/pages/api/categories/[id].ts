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

  const { id } = req.query;
  
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid category ID' });
  }

  // Check if the category exists
  const category = await prisma.category.findUnique({
    where: { id }
  });
  
  if (!category) {
    return res.status(404).json({ error: 'Category not found' });
  }

  // GET - Fetch a specific category
  if (req.method === 'GET') {
    return res.status(200).json(category);
  } 
  // PUT - Update a category
  else if (req.method === 'PUT') {
    try {
      const { name, description } = req.body;
      
      if (!name || name.trim() === '') {
        return res.status(400).json({ error: 'Category name is required' });
      }
      
      // Check if another category with the same name exists (excluding current one)
      const existingCategory = await prisma.category.findFirst({
        where: { 
          name: name.trim(),
          NOT: { id }
        }
      });
      
      if (existingCategory) {
        return res.status(400).json({ error: 'Another category with this name already exists' });
      }
      
      // Update the category
      const updatedCategory = await prisma.category.update({
        where: { id },
        data: {
          name: name.trim(),
          description: description || null
        }
      });
      
      // Log the action
      await prisma.auditLog.create({
        data: {
          action: 'UPDATE',
          entity: 'Category',
          entityId: updatedCategory.id,
          userId: user.id,
          details: `Updated category: ${updatedCategory.name}`
        }
      });
      
      return res.status(200).json(updatedCategory);
    } catch (error) {
      console.error('Error updating category:', error);
      return res.status(500).json({ error: 'Failed to update category' });
    }
  } 
  // DELETE - Delete a category
  else if (req.method === 'DELETE') {
    try {
      // Check if there are any tasks using this category
      const tasksWithCategory = await prisma.task.count({
        where: { categoryId: id }
      });
      
      if (tasksWithCategory > 0) {
        // Update tasks to remove the category reference instead of preventing deletion
        await prisma.task.updateMany({
          where: { categoryId: id },
          data: { categoryId: null }
        });
      }
      
      // Delete the category
      await prisma.category.delete({
        where: { id }
      });
      
      // Log the action
      await prisma.auditLog.create({
        data: {
          action: 'DELETE',
          entity: 'Category',
          entityId: id,
          userId: user.id,
          details: `Deleted category: ${category.name}`
        }
      });
      
      return res.status(200).json({ message: 'Category deleted successfully' });
    } catch (error) {
      console.error('Error deleting category:', error);
      return res.status(500).json({ error: 'Failed to delete category' });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

export default authMiddleware(handler);

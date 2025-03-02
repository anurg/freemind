import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Ensures that categories exist for all default categories in system settings
 * and updates existing tasks to use the new category relationship
 */
export async function ensureCategoriesExist() {
  try {
    console.log('Checking for categories...');
    
    // Get default categories from system settings
    const systemSettings = await prisma.systemSettings.findFirst();
    
    if (!systemSettings) {
      console.error('System settings not found');
      return;
    }
    
    const defaultCategories = systemSettings.defaultCategories;
    
    // Create categories based on default categories
    for (const categoryName of defaultCategories) {
      const existingCategory = await prisma.category.findFirst({
        where: { name: categoryName }
      });
      
      if (!existingCategory) {
        await prisma.category.create({
          data: {
            name: categoryName,
            description: `Default category: ${categoryName}`
          }
        });
        console.log(`Created category: ${categoryName}`);
      }
    }
    
    // Update existing tasks to use the new category relationship
    const categories = await prisma.category.findMany();
    const categoryMap = new Map(categories.map(c => [c.name, c.id]));
    
    const tasks = await prisma.task.findMany({
      where: {
        categoryId: null
      }
    });
    
    if (tasks.length > 0) {
      console.log(`Found ${tasks.length} tasks to update with category relationships`);
      
      for (const task of tasks) {
        const categoryId = categoryMap.get(task.category);
        
        if (categoryId) {
          await prisma.task.update({
            where: { id: task.id },
            data: { categoryId }
          });
        } else {
          // If no matching category, create a new one
          const newCategory = await prisma.category.create({
            data: {
              name: task.category || 'Uncategorized',
              description: `Auto-created from task category`
            }
          });
          
          await prisma.task.update({
            where: { id: task.id },
            data: { categoryId: newCategory.id }
          });
        }
      }
    }
    
    console.log('Category check completed');
  } catch (error) {
    console.error('Error ensuring categories exist:', error);
  } finally {
    await prisma.$disconnect();
  }
}

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding categories...');
  
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
    } else {
      console.log(`Category already exists: ${categoryName}`);
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
  
  console.log(`Found ${tasks.length} tasks to update with category relationships`);
  
  for (const task of tasks) {
    const categoryId = categoryMap.get(task.category);
    
    if (categoryId) {
      await prisma.task.update({
        where: { id: task.id },
        data: { categoryId }
      });
      console.log(`Updated task ${task.id} with category ${task.category}`);
    } else {
      console.log(`No matching category found for task ${task.id} with category ${task.category}`);
    }
  }
  
  console.log('Seeding completed');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

// @ts-nocheck
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function resetPasswords() {
  try {
    // Hash the new password "123"
    const hashedPassword = await bcrypt.hash('123', 10);
    
    // Update all users with the new password
    const result = await prisma.user.updateMany({
      data: {
        password: hashedPassword
      }
    });
    
    console.log(`Successfully reset passwords for ${result.count} users to "123"`);
  } catch (error) {
    console.error('Error resetting passwords:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetPasswords();

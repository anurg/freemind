const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  // Hash the new password
  const newPassword = await bcrypt.hash('123', 10);
  
  // Update all users with the new password
  const result = await prisma.user.updateMany({
    data: {
      password: newPassword
    }
  });
  
  console.log(`Updated passwords for ${result.count} users to "123"`);
}

main()
  .catch((e) => {
    console.error('Error updating passwords:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

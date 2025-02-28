import { PrismaClient, Role, TaskStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@freemind.com' },
    update: {},
    create: {
      email: 'admin@freemind.com',
      username: 'admin',
      password: adminPassword,
      role: Role.ADMIN,
    },
  });

  console.log('Created admin user:', admin.username);

  // Create manager user
  const managerPassword = await bcrypt.hash('manager123', 10);
  const manager = await prisma.user.upsert({
    where: { email: 'manager@freemind.com' },
    update: {},
    create: {
      email: 'manager@freemind.com',
      username: 'manager',
      password: managerPassword,
      role: Role.MANAGER,
    },
  });

  console.log('Created manager user:', manager.username);

  // Create regular user
  const userPassword = await bcrypt.hash('user123', 10);
  const user = await prisma.user.upsert({
    where: { email: 'user@freemind.com' },
    update: {},
    create: {
      email: 'user@freemind.com',
      username: 'user',
      password: userPassword,
      role: Role.USER,
    },
  });

  console.log('Created regular user:', user.username);

  // Create sample tasks
  const task1 = await prisma.task.create({
    data: {
      title: 'Implement User Authentication',
      description: 'Set up JWT authentication for the application',
      category: 'DEVELOPMENT',
      status: TaskStatus.COMPLETED,
      completionPercentage: 100,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      assignedTo: {
        connect: { id: user.id }
      },
      createdBy: {
        connect: { id: admin.id }
      }
    }
  });

  console.log('Created task:', task1.title);

  const task2 = await prisma.task.create({
    data: {
      title: 'Design Dashboard UI',
      description: 'Create wireframes and mockups for the dashboard',
      category: 'DESIGN',
      status: TaskStatus.IN_PROGRESS,
      completionPercentage: 60,
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      assignedTo: {
        connect: { id: manager.id }
      },
      createdBy: {
        connect: { id: admin.id }
      }
    }
  });

  console.log('Created task:', task2.title);

  const task3 = await prisma.task.create({
    data: {
      title: 'Implement Task Management API',
      description: 'Create REST API endpoints for task CRUD operations',
      category: 'DEVELOPMENT',
      status: TaskStatus.PENDING,
      completionPercentage: 0,
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      assignedTo: {
        connect: { id: user.id }
      },
      createdBy: {
        connect: { id: manager.id }
      }
    }
  });

  console.log('Created task:', task3.title);

  // Add comments to tasks
  const comment1 = await prisma.comment.create({
    data: {
      content: 'Authentication is working well, but we need to add password reset functionality',
      task: {
        connect: { id: task1.id }
      },
      user: {
        connect: { id: manager.id }
      }
    }
  });

  console.log('Created comment on task:', task1.title);

  const comment2 = await prisma.comment.create({
    data: {
      content: 'I\'ve completed the login page design, working on the dashboard now',
      task: {
        connect: { id: task2.id }
      },
      user: {
        connect: { id: manager.id }
      }
    }
  });

  console.log('Created comment on task:', task2.title);

  // Add progress history
  const progress1 = await prisma.progressHistory.create({
    data: {
      taskId: task1.id,
      previousPercentage: 80,
      newPercentage: 100,
      comment: 'Completed JWT implementation'
    }
  });

  console.log('Added progress history for task:', task1.title);

  const progress2 = await prisma.progressHistory.create({
    data: {
      taskId: task2.id,
      previousPercentage: 30,
      newPercentage: 60,
      comment: 'Completed wireframes, working on mockups'
    }
  });

  console.log('Added progress history for task:', task2.title);

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { PrismaClient } from '@prisma/client';
import { hashPassword } from '@/lib/auth';

const prisma = new PrismaClient();

async function seed() {
  const hashedPassword = await hashPassword('Santafee@1972-2907');

  const user = await prisma.user.upsert({
    where: { email: 'admin@seoexpert.com' },
    update: {},
    create: {
      email: 'admin@seoexpert.com',
      name: 'Admin',
      password: hashedPassword,
      role: 'admin',
    },
  });

  // Create default settings
  await prisma.userSettings.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      darkMode: true,
    },
  });

  // Create sample projects
  await prisma.project.createMany({
    data: [
      {
        name: 'My E-commerce Site',
        domain: 'example-shop.com',
        userId: user.id,
        isActive: true,
      },
      {
        name: 'Tech Blog',
        domain: 'techblog.io',
        userId: user.id,
        isActive: true,
      },
    ],

  });

  console.log('Seed completed successfully');
  console.log('Admin email: admin@seoexpert.com');
  console.log('Admin password: Santafee@1972-2907');
}

seed()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

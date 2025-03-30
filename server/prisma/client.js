const { PrismaClient } = require('@prisma/client');

let prisma;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  // Prevent multiple instances during development
  if (!global.prisma) {
    global.prisma = new PrismaClient({
      log: ['query', 'error', 'warn'],
    });
  }
  prisma = global.prisma;
}

// Verify connection
async function verifyConnection() {
  try {
    // Test the connection by making a simple query
    await prisma.$queryRaw`SELECT 1`;
    console.log('Prisma connection verified successfully');
  } catch (error) {
    console.error('Failed to verify Prisma connection:', error);
    // Try to reconnect
    await prisma.$connect();
  }
}

// Initial connection verification
verifyConnection().catch(console.error);

// Handle connection errors
prisma.$on('error', (e) => {
  console.error('Prisma Client error:', e);
  verifyConnection().catch(console.error);
});

module.exports = prisma;

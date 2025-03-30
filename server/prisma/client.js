const { PrismaClient } = require('@prisma/client');

// Prevent multiple instances of Prisma Client in development
const globalForPrisma = global;

// Maximum number of connection retries
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

async function createPrismaClient() {
  let retries = 0;
  
  while (retries < MAX_RETRIES) {
    try {
      const prisma = new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
        errorFormat: 'pretty',
        rejectOnNotFound: false,
      });

      // Test the connection
      await prisma.$connect();
      console.log('Prisma Client connected successfully');
      return prisma;
    } catch (error) {
      retries++;
      console.error(`Failed to create Prisma Client (attempt ${retries}/${MAX_RETRIES}):`, error);
      
      if (retries === MAX_RETRIES) {
        console.error('Max retries reached. Could not establish database connection.');
        throw error;
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
    }
  }
}

// Initialize Prisma Client with retries
const prismaClientPromise = createPrismaClient().catch(error => {
  console.error('Fatal: Failed to initialize Prisma Client:', error);
  process.exit(1);
});

// Export a proxy that waits for the client to be ready
module.exports = new Proxy({}, {
  get: (target, prop) => {
    return async (...args) => {
      const client = await prismaClientPromise;
      return client[prop](...args);
    };
  }
});

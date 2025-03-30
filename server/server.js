require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const prisma = require('./prisma/client');
const { authenticateToken } = require('./middleware/auth');

const authRoutes = require('./routes/auth');
const invoiceRoutes = require('./routes/invoice');
const addressBookRoutes = require('./routes/addressBook');
const adminRoutes = require('./routes/admin');
const uploadRoutes = require('./routes/upload');
const templateRoutes = require('./routes/template');
const catalogRoutes = require('./routes/catalog');
const integrationsRoutes = require('./routes/integrations');

const app = express();
const PORT = process.env.PORT || 5000;

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(500).json({
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Determine if we're in Vercel's serverless environment
const isVercel = process.env.VERCEL === '1';

// Test database connection
async function testDbConnection() {
  try {
    await prisma.$connect();
    console.log('Successfully connected to the database');
  } catch (error) {
    console.error('Database connection error:', error);
    throw error;
  }
}

// Health check route with DB connection status
app.get('/api/health', async (req, res) => {
  try {
    await testDbConnection();
    res.json({ 
      message: 'Invoice API Server is running',
      environment: isVercel ? 'production (Vercel)' : 'development',
      timestamp: new Date().toISOString(),
      database: 'connected'
    });
  } catch (error) {
    res.status(500).json({
      message: 'Server is running but database connection failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Database connection error',
      environment: isVercel ? 'production (Vercel)' : 'development',
      timestamp: new Date().toISOString(),
      database: 'disconnected'
    });
  }
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/invoice', authenticateToken, invoiceRoutes);
app.use('/api/address-book', authenticateToken, addressBookRoutes);
app.use('/api/admin', authenticateToken, adminRoutes);
app.use('/api/upload', authenticateToken, uploadRoutes);
app.use('/api/templates', authenticateToken, templateRoutes);
app.use('/api/catalog', authenticateToken, catalogRoutes);
app.use('/api/integrations', authenticateToken, integrationsRoutes);

// Serve static files in development
if (!isVercel) {
  app.use(express.static(path.join(__dirname, '../client/build')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build/index.html'));
  });
}

// Error handling for unhandled routes
app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    res.status(404).json({ message: 'API route not found' });
  }
});

// Connect to database before starting server
if (!isVercel) {
  testDbConnection()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
      });
    })
    .catch((error) => {
      console.error('Failed to start server:', error);
      process.exit(1);
    });
}

// Cleanup on server shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Cleaning up...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received. Cleaning up...');
  await prisma.$disconnect();
  process.exit(0);
});

// Export the Express app for Vercel
module.exports = app;

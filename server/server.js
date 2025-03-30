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

// Environment configuration with defaults
const config = {
  isVercel: process.env.VERCEL === '1',
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'default_development_secret',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000'
};

// Configure CORS
app.use(cors({
  origin: config.isVercel ? true : config.corsOrigin,
  credentials: true
}));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.log('Headers:', req.headers);
  next();
});

// Error handling middleware
app.use((err, req, res, next) => {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] Error:`, {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    headers: req.headers
  });
  
  res.status(500).json({
    error: config.nodeEnv === 'development' ? err.message : 'Internal server error',
    stack: config.nodeEnv === 'development' ? err.stack : undefined,
    timestamp
  });
});

// Body parsing middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Test database connection
async function testDbConnection() {
  try {
    await prisma.$connect();
    console.log('[Database] Successfully connected to the database');
    return true;
  } catch (error) {
    console.error('[Database] Connection error:', {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    return false;
  }
}

// Health check route with DB connection status
app.get('/api/health', async (req, res) => {
  console.log('[Health Check] Received request');
  const dbConnected = await testDbConnection();
  
  const response = {
    message: 'Invoice API Server is running',
    environment: config.isVercel ? 'production (Vercel)' : 'development',
    timestamp: new Date().toISOString(),
    database: dbConnected ? 'connected' : 'disconnected',
    node_env: config.nodeEnv,
    vercel: config.isVercel
  };
  
  console.log('[Health Check] Response:', response);
  
  if (!dbConnected) {
    return res.status(503).json(response);
  }
  
  res.json(response);
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

// API 404 handler for /api routes
app.use('/api/*', (req, res) => {
  console.log(`[404] API route not found: ${req.method} ${req.url}`);
  res.status(404).json({ 
    message: 'API route not found',
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Serve static files for both development and Vercel
const staticPath = path.join(__dirname, '../client/build');
app.use(express.static(staticPath));

// Catch-all route to serve index.html for client-side routing
app.get('*', (req, res) => {
  if (req.url.startsWith('/api/')) {
    return res.status(404).json({ message: 'API route not found' });
  }
  res.sendFile(path.join(staticPath, 'index.html'));
});

// Connect to database before starting server
if (!config.isVercel) {
  testDbConnection()
    .then((connected) => {
      if (!connected) {
        console.error('[Startup] Failed to connect to database');
        process.exit(1);
      }
      app.listen(PORT, () => {
        console.log(`[Server] Running on port ${PORT}`);
      });
    })
    .catch((error) => {
      console.error('[Startup] Failed to start server:', error);
      process.exit(1);
    });
}

// Cleanup on server shutdown
process.on('SIGTERM', async () => {
  console.log('[Shutdown] SIGTERM received. Cleaning up...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('[Shutdown] SIGINT received. Cleaning up...');
  await prisma.$disconnect();
  process.exit(0);
});

// Export the Express app for Vercel
module.exports = app;

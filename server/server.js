require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');
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
  jwtSecret: process.env.VERCEL_JWT_SECRET || process.env.JWT_SECRET || 'default_development_secret',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000'
};

// Configure CORS with proper Vercel headers
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (config.isVercel) {
      // In Vercel, allow same-origin and vercel.app domains
      if (origin.includes('vercel.app') || origin === req.headers.host) {
        return callback(null, true);
      }
    } else if (origin === config.corsOrigin) {
      // In development, only allow configured origin
      return callback(null, true);
    }
    
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'x-vercel-forwarded-for'],
  exposedHeaders: ['Set-Cookie']
}));

// Parse cookies
app.use(cookieParser());

// Parse JSON bodies
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  console.log('Headers:', {
    ...req.headers,
    cookie: '***filtered***' // Don't log cookie contents
  });
  console.log('Environment:', {
    isVercel: config.isVercel,
    nodeEnv: config.nodeEnv
  });
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
    headers: {
      ...req.headers,
      cookie: '***filtered***'
    }
  });
  
  res.status(500).json({
    error: 'Internal server error',
    requestId: req.headers['x-vercel-id'] || 'local'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/invoices', authenticateToken, invoiceRoutes);
app.use('/api/address-book', authenticateToken, addressBookRoutes);
app.use('/api/admin', authenticateToken, adminRoutes);
app.use('/api/upload', authenticateToken, uploadRoutes);
app.use('/api/templates', authenticateToken, templateRoutes);
app.use('/api/catalog', authenticateToken, catalogRoutes);
app.use('/api/integrations', authenticateToken, integrationsRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    environment: config.nodeEnv,
    isVercel: config.isVercel,
    timestamp: new Date().toISOString()
  });
});

// Handle Vercel's zero-config deployment
if (config.isVercel) {
  // Serve static files from the React app
  app.use(express.static(path.join(__dirname, '../client/build')));

  // The "catchall" handler: for any request that doesn't
  // match one above, send back React's index.html file.
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build/index.html'));
  });
}

const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log('Environment:', {
    isVercel: config.isVercel,
    nodeEnv: config.nodeEnv
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Closing HTTP server...');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

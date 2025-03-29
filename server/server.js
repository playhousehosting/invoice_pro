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

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Determine if we're in Vercel's serverless environment
const isVercel = process.env.VERCEL === '1';

// Only set up static file serving in development (not needed in Vercel)
if (!isVercel) {
  // Serve static files from the uploads directory
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
}

// Health check route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Invoice API Server is running',
    environment: isVercel ? 'production (Vercel)' : 'development',
    timestamp: new Date().toISOString()
  });
});

// API routes
app.use('/api/auth', authRoutes);
// Protected routes - require authentication
app.use('/api/invoice', authenticateToken, invoiceRoutes);
app.use('/api/address-book', authenticateToken, addressBookRoutes);
app.use('/api/admin', authenticateToken, adminRoutes);
app.use('/api/upload', authenticateToken, uploadRoutes);
app.use('/api/templates', authenticateToken, templateRoutes);
app.use('/api/catalog', authenticateToken, catalogRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Only start the server if not in Vercel (in Vercel, we export the app)
if (!isVercel) {
  const server = app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
  
  // Handle graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully');
    await prisma.$disconnect();
    server.close(() => {
      console.log('Process terminated');
    });
  });
}

module.exports = app;

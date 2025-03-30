// Special entry point for Vercel serverless deployment
require('dotenv').config();
const express = require('express');
const app = express();

// Log when the serverless function is initialized
console.log('[Vercel] Serverless function initialized');

// Import the server app
const serverApp = require('../server/server');

// Use the server app as middleware
app.use(serverApp);

// Add a catch-all route for debugging
app.all('*', (req, res) => {
  console.log('[Vercel] Received request:', {
    method: req.method,
    url: req.url,
    headers: req.headers,
    timestamp: new Date().toISOString()
  });
  
  // If it's not an API route, let the client handle it
  if (!req.url.startsWith('/api/')) {
    res.status(404).send('Not found - Client route');
    return;
  }
  
  // For API routes that weren't handled, return 404
  res.status(404).json({
    error: 'API route not found',
    method: req.method,
    url: req.url,
    timestamp: new Date().toISOString()
  });
});

// Export the Express app as a serverless function
module.exports = app;

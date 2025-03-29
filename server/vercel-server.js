// Special entry point for Vercel serverless deployment
require('dotenv').config();
const app = require('./server');

// Export the Express app as a serverless function
module.exports = app;

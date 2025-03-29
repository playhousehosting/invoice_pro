const express = require('express');
const jwt = require('jsonwebtoken');
const prisma = require('../prisma/client');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// JWT Secret from environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key';

// Middleware to verify token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'Authentication required.' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token.' });
    }
    req.user = user;
    next();
  });
};

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Create invoice endpoint
router.post('/', async (req, res) => {
  try {
    const { client, companyInfo, items, total } = req.body;
    
    if (!client || !items || !total) {
      return res.status(400).json({ message: 'Missing invoice data.' });
    }

    // Get current user
    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    // Initialize invoices array if it doesn't exist
    const currentPreferences = user.preferences || {};
    const invoices = currentPreferences.invoices || [];
    
    // Create new invoice
    const newInvoice = {
      id: uuidv4(),
      client,
      companyInfo,
      items,
      total,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Add new invoice to array
    invoices.push(newInvoice);

    // Update user preferences
    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        preferences: {
          ...currentPreferences,
          invoices
        }
      }
    });
    
    res.status(201).json(newInvoice);
  } catch (error) {
    console.error('Create invoice error:', error);
    res.status(500).json({ 
      message: 'Failed to create invoice.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get all invoices for current user
router.get('/', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    const invoices = user?.preferences?.invoices || [];
    res.json(invoices.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
  } catch (error) {
    console.error('Get invoices error:', error);
    res.status(500).json({ 
      message: 'Failed to retrieve invoices.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get a specific invoice by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    const invoice = user?.preferences?.invoices?.find(inv => inv.id === id);
    
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found.' });
    }
    
    res.json(invoice);
  } catch (error) {
    console.error('Get invoice error:', error);
    res.status(500).json({ 
      message: 'Failed to retrieve invoice.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Delete an invoice
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get current user and invoices
    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    const currentPreferences = user.preferences || {};
    const invoices = currentPreferences.invoices || [];
    
    // Find invoice index
    const invoiceIndex = invoices.findIndex(inv => inv.id === id);
    
    if (invoiceIndex === -1) {
      return res.status(404).json({ message: 'Invoice not found.' });
    }
    
    // Remove invoice from array
    invoices.splice(invoiceIndex, 1);
    
    // Update user preferences
    await prisma.user.update({
      where: { id: req.user.id },
      data: {
        preferences: {
          ...currentPreferences,
          invoices
        }
      }
    });
    
    res.json({ message: 'Invoice deleted successfully.' });
  } catch (error) {
    console.error('Delete invoice error:', error);
    res.status(500).json({ 
      message: 'Failed to delete invoice.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;

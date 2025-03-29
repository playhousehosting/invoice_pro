const express = require('express');
const jwt = require('jsonwebtoken');
const prisma = require('../prisma/client');

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

// Create invoice endpoint
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { client, companyInfo, items, total } = req.body;
    
    if (!client || !items || !total) {
      return res.status(400).json({ message: 'Missing invoice data.' });
    }
    
    const newInvoice = await prisma.invoice.create({
      data: {
        userId: req.user.id,
        client,
        companyInfo,
        items,
        total
      }
    });
    
    res.status(201).json(newInvoice);
  } catch (error) {
    console.error('Create invoice error:', error);
    res.status(500).json({ message: 'Failed to create invoice.' });
  }
});

// Get all invoices for current user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userInvoices = await prisma.invoice.findMany({
      where: {
        userId: req.user.id
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    res.json(userInvoices);
  } catch (error) {
    console.error('Get invoices error:', error);
    res.status(500).json({ message: 'Failed to retrieve invoices.' });
  }
});

// Get a specific invoice by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const invoiceId = parseInt(req.params.id);
    
    const invoice = await prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        userId: req.user.id
      }
    });
    
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found.' });
    }
    
    res.json(invoice);
  } catch (error) {
    console.error('Get invoice error:', error);
    res.status(500).json({ message: 'Failed to retrieve invoice.' });
  }
});

// Delete an invoice
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const invoiceId = parseInt(req.params.id);
    
    // Check if invoice exists and belongs to user
    const invoice = await prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        userId: req.user.id
      }
    });
    
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found.' });
    }
    
    // Delete the invoice
    await prisma.invoice.delete({
      where: {
        id: invoiceId
      }
    });
    
    res.status(204).send();
  } catch (error) {
    console.error('Delete invoice error:', error);
    res.status(500).json({ message: 'Failed to delete invoice.' });
  }
});

module.exports = router;

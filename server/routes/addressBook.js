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

// Get all contacts for the current user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userContacts = await prisma.contact.findMany({
      where: {
        userId: req.user.id
      },
      orderBy: {
        name: 'asc'
      }
    });
    
    res.json(userContacts);
  } catch (error) {
    console.error('Get contacts error:', error);
    res.status(500).json({ message: 'Failed to retrieve contacts.' });
  }
});

// Add a new contact
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, email, address, phone } = req.body;
    
    if (!name) {
      return res.status(400).json({ message: 'Contact name is required.' });
    }
    
    const newContact = await prisma.contact.create({
      data: {
        userId: req.user.id,
        name,
        email: email || null,
        address: address || null,
        phone: phone || null
      }
    });
    
    res.status(201).json(newContact);
  } catch (error) {
    console.error('Create contact error:', error);
    res.status(500).json({ message: 'Failed to create contact.' });
  }
});

// Get a specific contact by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const contactId = parseInt(req.params.id);
    
    const contact = await prisma.contact.findFirst({
      where: {
        id: contactId,
        userId: req.user.id
      }
    });
    
    if (!contact) {
      return res.status(404).json({ message: 'Contact not found.' });
    }
    
    res.json(contact);
  } catch (error) {
    console.error('Get contact error:', error);
    res.status(500).json({ message: 'Failed to retrieve contact.' });
  }
});

// Update a contact
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const contactId = parseInt(req.params.id);
    const { name, email, address, phone } = req.body;
    
    if (!name) {
      return res.status(400).json({ message: 'Contact name is required.' });
    }
    
    // Check if contact exists and belongs to user
    const existingContact = await prisma.contact.findFirst({
      where: {
        id: contactId,
        userId: req.user.id
      }
    });
    
    if (!existingContact) {
      return res.status(404).json({ message: 'Contact not found.' });
    }
    
    // Update the contact
    const updatedContact = await prisma.contact.update({
      where: {
        id: contactId
      },
      data: {
        name,
        email: email || null,
        address: address || null,
        phone: phone || null
      }
    });
    
    res.json(updatedContact);
  } catch (error) {
    console.error('Update contact error:', error);
    res.status(500).json({ message: 'Failed to update contact.' });
  }
});

// Delete a contact
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const contactId = parseInt(req.params.id);
    
    // Check if contact exists and belongs to user
    const contact = await prisma.contact.findFirst({
      where: {
        id: contactId,
        userId: req.user.id
      }
    });
    
    if (!contact) {
      return res.status(404).json({ message: 'Contact not found.' });
    }
    
    // Delete the contact
    await prisma.contact.delete({
      where: {
        id: contactId
      }
    });
    
    res.status(204).send();
  } catch (error) {
    console.error('Delete contact error:', error);
    res.status(500).json({ message: 'Failed to delete contact.' });
  }
});

module.exports = router;

const express = require('express');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
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
    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    const contacts = user?.preferences?.contacts || [];
    res.json(contacts.sort((a, b) => a.name.localeCompare(b.name)));
  } catch (error) {
    console.error('Get contacts error:', error);
    res.status(500).json({ 
      message: 'Failed to retrieve contacts.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Add a new contact
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, email, address, phone } = req.body;
    
    if (!name) {
      return res.status(400).json({ message: 'Contact name is required.' });
    }

    // Get current user
    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    // Initialize contacts array if it doesn't exist
    const currentPreferences = user.preferences || {};
    const contacts = currentPreferences.contacts || [];
    
    // Create new contact
    const newContact = {
      id: uuidv4(),
      name,
      email: email || null,
      address: address || null,
      phone: phone || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Add new contact to array
    contacts.push(newContact);

    // Update user preferences
    await prisma.user.update({
      where: { id: req.user.id },
      data: {
        preferences: {
          ...currentPreferences,
          contacts
        }
      }
    });
    
    res.status(201).json(newContact);
  } catch (error) {
    console.error('Create contact error:', error);
    res.status(500).json({ 
      message: 'Failed to create contact.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get a specific contact by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    const contact = user?.preferences?.contacts?.find(c => c.id === id);
    
    if (!contact) {
      return res.status(404).json({ message: 'Contact not found.' });
    }
    
    res.json(contact);
  } catch (error) {
    console.error('Get contact error:', error);
    res.status(500).json({ 
      message: 'Failed to retrieve contact.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Update a contact
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, address, phone } = req.body;
    
    if (!name) {
      return res.status(400).json({ message: 'Contact name is required.' });
    }

    // Get current user
    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    // Get current contacts
    const currentPreferences = user.preferences || {};
    const contacts = currentPreferences.contacts || [];
    
    // Find contact index
    const contactIndex = contacts.findIndex(c => c.id === id);
    
    if (contactIndex === -1) {
      return res.status(404).json({ message: 'Contact not found.' });
    }

    // Update contact
    contacts[contactIndex] = {
      ...contacts[contactIndex],
      name,
      email: email || null,
      address: address || null,
      phone: phone || null,
      updatedAt: new Date()
    };

    // Update user preferences
    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        preferences: {
          ...currentPreferences,
          contacts
        }
      }
    });
    
    res.json(contacts[contactIndex]);
  } catch (error) {
    console.error('Update contact error:', error);
    res.status(500).json({ 
      message: 'Failed to update contact.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Delete a contact
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get current user
    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    // Get current contacts
    const currentPreferences = user.preferences || {};
    const contacts = currentPreferences.contacts || [];
    
    // Find contact index
    const contactIndex = contacts.findIndex(c => c.id === id);
    
    if (contactIndex === -1) {
      return res.status(404).json({ message: 'Contact not found.' });
    }

    // Remove contact from array
    contacts.splice(contactIndex, 1);

    // Update user preferences
    await prisma.user.update({
      where: { id: req.user.id },
      data: {
        preferences: {
          ...currentPreferences,
          contacts
        }
      }
    });
    
    res.status(204).send();
  } catch (error) {
    console.error('Delete contact error:', error);
    res.status(500).json({ 
      message: 'Failed to delete contact.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;

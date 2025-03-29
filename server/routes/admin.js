const express = require('express');
const prisma = require('../prisma/client');
const router = express.Router();

// Middleware to check if user is admin
const isAdmin = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    if (user?.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Admin access required.' });
    }

    next();
  } catch (error) {
    console.error('Admin check error:', error);
    res.status(500).json({ message: 'Failed to verify admin status.' });
  }
};

// Get all users (admin only)
router.get('/users', isAdmin, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Failed to retrieve users.' });
  }
});

// Update user role (admin only)
router.put('/users/:id/role', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    // Validate role
    if (!['USER', 'ADMIN'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role.' });
    }

    // Prevent admin from changing their own role
    if (id === req.user.id) {
      return res.status(400).json({ message: 'Cannot change your own role.' });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.json(updatedUser);
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ message: 'Failed to update user role.' });
  }
});

module.exports = router;

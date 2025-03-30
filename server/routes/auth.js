const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const prisma = require('../prisma/client');
const router = express.Router();

// Environment configuration with defaults
const config = {
  jwtSecret: process.env.JWT_SECRET || 'default_development_secret',
  jwtExpiration: process.env.JWT_EXPIRATION || '24h',
  nodeEnv: process.env.NODE_ENV || 'development'
};

// Warn if using default secret in production
if (config.nodeEnv === 'production' && !process.env.JWT_SECRET) {
  console.warn('Warning: Using default JWT secret in production. This is not recommended.');
}

// Register endpoint
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered.' });
    }

    // Check if this is the first user
    const userCount = await prisma.user.count();
    const isFirstUser = userCount === 0;

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await prisma.user.create({
      data: {
        id: uuidv4(),
        name,
        email,
        password: hashedPassword,
        role: isFirstUser ? 'ADMIN' : 'USER', // First user gets admin role
        updatedAt: new Date()
      }
    });

    res.status(201).json({ 
      message: 'Registration successful.',
      isAdmin: isFirstUser // Let the client know if this was the first user
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      message: 'Failed to register.',
      error: config.nodeEnv === 'development' ? error.message : undefined
    });
  }
});

// One-time setup route to promote first admin
router.post('/setup-admin', async (req, res) => {
  try {
    const { email } = req.body;

    // Check if we already have an admin by checking the role field
    const existingAdmin = await prisma.user.findFirst({
      where: {
        OR: [
          { role: 'ADMIN' },
          { role: { equals: 'ADMIN' } }
        ]
      }
    });

    if (existingAdmin) {
      return res.status(400).json({ message: 'An admin user already exists.' });
    }

    // Find the user to promote
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Promote the user to admin using raw SQL to avoid schema validation
    await prisma.$executeRaw`UPDATE "User" SET role = 'ADMIN' WHERE id = ${user.id}`;

    // Fetch the updated user
    const updatedUser = await prisma.user.findUnique({
      where: { id: user.id }
    });

    res.json({
      message: 'User promoted to admin successfully',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        role: updatedUser.role
      }
    });
  } catch (error) {
    console.error('Setup admin error:', error);
    res.status(500).json({
      message: 'Failed to setup admin.',
      error: config.nodeEnv === 'development' ? error.message : undefined
    });
  }
});

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      config.jwtSecret,
      { expiresIn: config.jwtExpiration }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Error during login.' });
  }
});

// Get current user endpoint
router.get('/me', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        image: true
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ 
      message: 'Failed to get user information.',
      error: config.nodeEnv === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;

const jwt = require('jsonwebtoken');
const prisma = require('../prisma/client');

// Use Vercel's JWT secret in production, fallback to local secret
const JWT_SECRET = process.env.VERCEL_JWT_SECRET || process.env.JWT_SECRET || 'default_development_secret';
if (process.env.NODE_ENV === 'production' && !process.env.VERCEL_JWT_SECRET && !process.env.JWT_SECRET) {
  console.warn('Warning: Using default JWT secret in production. This is not recommended.');
}

const authenticateToken = (req, res, next) => {
  // Try to get token from Authorization header
  const authHeader = req.headers['authorization'];
  let token = authHeader && authHeader.split(' ')[1];

  // If no token in header, try to get from _vercel_jwt cookie
  if (!token && req.cookies && req.cookies._vercel_jwt) {
    token = req.cookies._vercel_jwt;
  }

  if (!token) {
    return res.status(401).json({ message: 'Authentication required.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Map Vercel JWT structure to our user object
    req.user = {
      id: decoded.userId || decoded.sub, // Vercel uses userId, fallback to sub
      username: decoded.username,
      email: decoded.email,
      ownerId: decoded.ownerId, // Vercel team ID
      role: decoded.role || 'USER' // Default to USER role if not specified
    };

    // Log successful auth for debugging
    console.log('Authentication successful:', {
      userId: req.user.id,
      username: req.user.username,
      ownerId: req.user.ownerId
    });

    next();
  } catch (error) {
    console.error('Auth error:', error, { token });
    return res.status(403).json({ message: 'Invalid or expired token.' });
  }
};

const isAdmin = async (req, res, next) => {
  try {
    // For Vercel deployment, check if user is team owner
    if (process.env.VERCEL === '1' && req.user.ownerId) {
      req.user.role = 'ADMIN';
      return next();
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    if (!user || (user.role !== 'ADMIN' && user.role?.toString() !== 'ADMIN')) {
      return res.status(403).json({ message: 'Admin access required.' });
    }

    next();
  } catch (error) {
    console.error('Admin check error:', error);
    res.status(500).json({ message: 'Failed to verify admin status.' });
  }
};

module.exports = { authenticateToken, isAdmin };

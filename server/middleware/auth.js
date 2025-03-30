const jwt = require('jsonwebtoken');
const prisma = require('../prisma/client');

// Use a default secret for development, but warn if it's used in production
const JWT_SECRET = process.env.JWT_SECRET || 'default_development_secret';
if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
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
    req.user = decoded;

    // Add userId from Vercel JWT if available
    if (decoded.userId) {
      req.user.id = decoded.userId;
    }

    next();
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(403).json({ message: 'Invalid or expired token.' });
  }
};

const isAdmin = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    // Check role without schema validation
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

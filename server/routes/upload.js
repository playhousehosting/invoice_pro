const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const prisma = require('../prisma/client');

const router = express.Router();

// JWT Secret from environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key';

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueFilename = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueFilename);
  }
});

// File filter to only allow image files
const fileFilter = (req, file, cb) => {
  // Accept only image files
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

// Configure multer upload
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max file size
  },
  fileFilter: fileFilter
});

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

// Upload logo endpoint
router.post('/logo', authenticateToken, upload.single('logo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded.' });
    }
    
    // Get relative path to the file
    const logoPath = `/uploads/${req.file.filename}`;
    
    // Update user with logo path
    await prisma.user.update({
      where: {
        id: req.user.id
      },
      data: {
        logoPath
      }
    });
    
    res.json({ 
      message: 'Logo uploaded successfully.',
      logoPath
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Failed to upload logo.' });
  }
});

// Get user logo endpoint
router.get('/logo', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: req.user.id
      },
      select: {
        logoPath: true
      }
    });
    
    if (!user || !user.logoPath) {
      return res.status(404).json({ message: 'No logo found.' });
    }
    
    res.json({ logoPath: user.logoPath });
  } catch (error) {
    console.error('Get logo error:', error);
    res.status(500).json({ message: 'Failed to retrieve logo.' });
  }
});

// Delete logo endpoint
router.delete('/logo', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: req.user.id
      },
      select: {
        logoPath: true
      }
    });
    
    if (!user || !user.logoPath) {
      return res.status(404).json({ message: 'No logo found.' });
    }
    
    // Get the file path
    const filePath = path.join(__dirname, '..', user.logoPath);
    
    // Delete the file if it exists
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    // Update user to remove logo path
    await prisma.user.update({
      where: {
        id: req.user.id
      },
      data: {
        logoPath: null
      }
    });
    
    res.status(204).send();
  } catch (error) {
    console.error('Delete logo error:', error);
    res.status(500).json({ message: 'Failed to delete logo.' });
  }
});

module.exports = router;

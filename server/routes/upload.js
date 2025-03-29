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

// Check if we're in production (Vercel) or development environment
const isProduction = process.env.VERCEL === '1';

// Storage configuration based on environment
let storage;
let uploadsDir;

if (isProduction) {
  // In production (Vercel), use memory storage
  storage = multer.memoryStorage();
} else {
  // In development, use disk storage
  uploadsDir = path.join(__dirname, '../uploads');
  
  // Create uploads directory if it doesn't exist (only in development)
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  
  storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
      const uniqueFilename = `${uuidv4()}${path.extname(file.originalname)}`;
      cb(null, uniqueFilename);
    }
  });
}

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
    
    let imagePath;
    
    if (isProduction) {
      // In production, we can't save files to disk
      // Instead, we'll save a placeholder and in a real app
      // you would use a cloud storage service like S3
      imagePath = `/placeholder-${uuidv4()}.png`;
    } else {
      // In development, use the file path on disk
      imagePath = `/uploads/${req.file.filename}`;
    }
    
    // Update user with logo path
    await prisma.user.update({
      where: {
        id: req.user.id
      },
      data: {
        image: imagePath
      }
    });
    
    res.json({ 
      message: 'Logo uploaded successfully.',
      imagePath
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
        image: true
      }
    });
    
    if (!user || !user.image) {
      return res.status(404).json({ message: 'No logo found.' });
    }
    
    res.json({ imagePath: user.image });
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
        image: true
      }
    });
    
    if (!user || !user.image) {
      return res.status(404).json({ message: 'No logo found.' });
    }
    
    // Only attempt to delete the file in development environment
    if (!isProduction && user.image.startsWith('/uploads/')) {
      // Get the file path
      const filePath = path.join(__dirname, '..', user.image);
      
      // Delete the file if it exists
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    
    // Update user to remove logo path
    await prisma.user.update({
      where: {
        id: req.user.id
      },
      data: {
        image: null
      }
    });
    
    res.status(204).send();
  } catch (error) {
    console.error('Delete logo error:', error);
    res.status(500).json({ message: 'Failed to delete logo.' });
  }
});

module.exports = router;

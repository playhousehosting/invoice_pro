const express = require('express');
const router = express.Router();
const prisma = require('../prisma/client');
const { authenticateToken } = require('../middleware/auth');

// Get all templates for a user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        preferences: true
      }
    });

    // Initialize templates array if it doesn't exist
    const templates = user?.preferences?.templates || [];
    res.json({ success: true, data: templates });
  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({ success: false, message: 'Failed to get templates' });
  }
});

// Save a new template
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, companyInfo, items } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Name is required' });
    }

    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ success: false, message: 'Items must be an array' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        preferences: true
      }
    });

    const templates = user?.preferences?.templates || [];
    const newTemplate = {
      id: Date.now().toString(),
      name,
      companyInfo: companyInfo || {
        name: '',
        address: '',
        phone: '',
        email: ''
      },
      items
    };

    await prisma.user.update({
      where: { id: req.user.id },
      data: {
        preferences: {
          ...(user?.preferences || {}),
          templates: [...templates, newTemplate]
        }
      }
    });

    res.status(201).json({ success: true, data: newTemplate });
  } catch (error) {
    console.error('Create template error:', error);
    res.status(500).json({ success: false, message: 'Failed to create template' });
  }
});

// Update a template
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, companyInfo, items } = req.body;

    if (!id) {
      return res.status(400).json({ success: false, message: 'ID is required' });
    }

    if (!name) {
      return res.status(400).json({ success: false, message: 'Name is required' });
    }

    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ success: false, message: 'Items must be an array' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        preferences: true
      }
    });

    const templates = user?.preferences?.templates || [];
    const templateIndex = templates.findIndex(t => t.id === id);

    if (templateIndex === -1) {
      return res.status(404).json({ success: false, message: 'Template not found' });
    }

    const updatedTemplate = {
      ...templates[templateIndex],
      name,
      companyInfo: companyInfo || templates[templateIndex].companyInfo,
      items
    };

    templates[templateIndex] = updatedTemplate;

    await prisma.user.update({
      where: { id: req.user.id },
      data: {
        preferences: {
          ...(user?.preferences || {}),
          templates
        }
      }
    });

    res.json({ success: true, data: updatedTemplate });
  } catch (error) {
    console.error('Update template error:', error);
    res.status(500).json({ success: false, message: 'Failed to update template' });
  }
});

// Delete a template
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ success: false, message: 'ID is required' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        preferences: true
      }
    });

    const templates = user?.preferences?.templates || [];
    const filteredTemplates = templates.filter(t => t.id !== id);

    if (templates.length === filteredTemplates.length) {
      return res.status(404).json({ success: false, message: 'Template not found' });
    }

    await prisma.user.update({
      where: { id: req.user.id },
      data: {
        preferences: {
          ...(user?.preferences || {}),
          templates: filteredTemplates
        }
      }
    });

    res.json({ success: true, message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Delete template error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete template' });
  }
});

module.exports = router;

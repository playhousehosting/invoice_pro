const express = require('express');
const router = express.Router();
const prisma = require('../prisma/client');

// Get all templates for a user
router.get('/', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    const templates = user?.preferences?.templates || [];
    res.json(templates);
  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({ message: 'Failed to get templates' });
  }
});

// Save a new template
router.post('/', async (req, res) => {
  try {
    const { name, companyInfo, items } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    const templates = user?.preferences?.templates || [];
    const newTemplate = {
      id: Date.now().toString(),
      name,
      companyInfo,
      items
    };

    await prisma.user.update({
      where: { id: req.user.id },
      data: {
        preferences: {
          ...user.preferences,
          templates: [...templates, newTemplate]
        }
      }
    });

    res.status(201).json(newTemplate);
  } catch (error) {
    console.error('Create template error:', error);
    res.status(500).json({ message: 'Failed to create template' });
  }
});

// Update a template
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, companyInfo, items } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    const templates = user?.preferences?.templates || [];
    const templateIndex = templates.findIndex(t => t.id === id);

    if (templateIndex === -1) {
      return res.status(404).json({ message: 'Template not found' });
    }

    templates[templateIndex] = {
      ...templates[templateIndex],
      name,
      companyInfo,
      items
    };

    await prisma.user.update({
      where: { id: req.user.id },
      data: {
        preferences: {
          ...user.preferences,
          templates
        }
      }
    });

    res.json(templates[templateIndex]);
  } catch (error) {
    console.error('Update template error:', error);
    res.status(500).json({ message: 'Failed to update template' });
  }
});

// Delete a template
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    const templates = user?.preferences?.templates || [];
    const filteredTemplates = templates.filter(t => t.id !== id);

    await prisma.user.update({
      where: { id: req.user.id },
      data: {
        preferences: {
          ...user.preferences,
          templates: filteredTemplates
        }
      }
    });

    res.json({ message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Delete template error:', error);
    res.status(500).json({ message: 'Failed to delete template' });
  }
});

module.exports = router;

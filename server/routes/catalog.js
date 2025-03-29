const express = require('express');
const router = express.Router();
const prisma = require('../prisma/client');

// Get all catalog items for a user
router.get('/', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    const catalog = user?.preferences?.catalog || [];
    res.json(catalog);
  } catch (error) {
    console.error('Get catalog error:', error);
    res.status(500).json({ message: 'Failed to get catalog items' });
  }
});

// Add a new catalog item
router.post('/', async (req, res) => {
  try {
    const { name, description, rate, type } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    const catalog = user?.preferences?.catalog || [];
    const newItem = {
      id: Date.now().toString(),
      name,
      description,
      rate,
      type // 'product' or 'service'
    };

    await prisma.user.update({
      where: { id: req.user.id },
      data: {
        preferences: {
          ...user.preferences,
          catalog: [...catalog, newItem]
        }
      }
    });

    res.status(201).json(newItem);
  } catch (error) {
    console.error('Create catalog item error:', error);
    res.status(500).json({ message: 'Failed to create catalog item' });
  }
});

// Update a catalog item
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, rate, type } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    const catalog = user?.preferences?.catalog || [];
    const itemIndex = catalog.findIndex(item => item.id === id);

    if (itemIndex === -1) {
      return res.status(404).json({ message: 'Catalog item not found' });
    }

    catalog[itemIndex] = {
      ...catalog[itemIndex],
      name,
      description,
      rate,
      type
    };

    await prisma.user.update({
      where: { id: req.user.id },
      data: {
        preferences: {
          ...user.preferences,
          catalog
        }
      }
    });

    res.json(catalog[itemIndex]);
  } catch (error) {
    console.error('Update catalog item error:', error);
    res.status(500).json({ message: 'Failed to update catalog item' });
  }
});

// Delete a catalog item
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    const catalog = user?.preferences?.catalog || [];
    const filteredCatalog = catalog.filter(item => item.id !== id);

    await prisma.user.update({
      where: { id: req.user.id },
      data: {
        preferences: {
          ...user.preferences,
          catalog: filteredCatalog
        }
      }
    });

    res.json({ message: 'Catalog item deleted successfully' });
  } catch (error) {
    console.error('Delete catalog item error:', error);
    res.status(500).json({ message: 'Failed to delete catalog item' });
  }
});

module.exports = router;

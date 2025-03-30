const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const integrationManager = require('../services/integrationManager');

// Get available integrations
router.get('/available', authenticateToken, (req, res) => {
  try {
    const availableIntegrations = Object.keys(integrationManager.services);
    res.json({ integrations: availableIntegrations });
  } catch (error) {
    console.error('Error getting available integrations:', error);
    res.status(500).json({ message: 'Failed to get available integrations' });
  }
});

// Get user's integrations
router.get('/', authenticateToken, async (req, res) => {
  try {
    const integrations = await integrationManager.getUserIntegrations(req.user.id);
    res.json({ integrations });
  } catch (error) {
    console.error('Error getting user integrations:', error);
    res.status(500).json({ message: 'Failed to get user integrations' });
  }
});

// Connect integration
router.post('/connect/:type', authenticateToken, async (req, res) => {
  const { type } = req.params;
  const credentials = req.body;

  try {
    if (!integrationManager.services[type]) {
      return res.status(400).json({ 
        message: `Integration '${type}' is not available or not properly configured` 
      });
    }

    const integration = await integrationManager.connectIntegration(
      req.user.id,
      type,
      credentials
    );
    res.json({ integration });
  } catch (error) {
    console.error(`Error connecting ${type} integration:`, error);
    res.status(500).json({ 
      message: `Failed to connect ${type} integration`,
      error: error.message 
    });
  }
});

// Disconnect integration
router.delete('/:type', authenticateToken, async (req, res) => {
  const { type } = req.params;

  try {
    if (!integrationManager.services[type]) {
      return res.status(400).json({ 
        message: `Integration '${type}' is not available or not properly configured` 
      });
    }

    await integrationManager.disconnectIntegration(req.user.id, type);
    res.json({ message: `Successfully disconnected ${type} integration` });
  } catch (error) {
    console.error(`Error disconnecting ${type} integration:`, error);
    res.status(500).json({ 
      message: `Failed to disconnect ${type} integration`,
      error: error.message 
    });
  }
});

module.exports = router;

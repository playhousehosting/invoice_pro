const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const integrationManager = require('../services/integrationManager');

// Get all available integrations
router.get('/available', authenticateToken, async (req, res) => {
  try {
    const availableIntegrations = await integrationManager.getAvailableIntegrations();
    res.json(availableIntegrations);
  } catch (error) {
    console.error('Get available integrations error:', error);
    res.status(500).json({ error: 'Failed to get available integrations' });
  }
});

// Get user's enabled integrations
router.get('/user', authenticateToken, async (req, res) => {
  try {
    const userIntegrations = await integrationManager.getUserIntegrations(req.user.id);
    res.json(userIntegrations);
  } catch (error) {
    console.error('Get user integrations error:', error);
    res.status(500).json({ error: 'Failed to get user integrations' });
  }
});

// Enable/disable an integration
router.post('/:integration/toggle', authenticateToken, async (req, res) => {
  try {
    const { integration } = req.params;
    const { enabled, config } = req.body;

    if (enabled && config) {
      const isValid = await integrationManager.validateIntegrationConfig(integration, config);
      if (!isValid) {
        return res.status(400).json({ error: 'Invalid integration configuration' });
      }
    }

    const updated = await integrationManager.updateIntegration(
      req.user.id,
      integration,
      enabled,
      config
    );

    res.json(updated);
  } catch (error) {
    console.error('Toggle integration error:', error);
    res.status(500).json({ error: 'Failed to toggle integration' });
  }
});

// Update integration configuration
router.put('/:integration/config', authenticateToken, async (req, res) => {
  try {
    const { integration } = req.params;
    const { config } = req.body;

    const isValid = await integrationManager.validateIntegrationConfig(integration, config);
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid integration configuration' });
    }

    const updated = await integrationManager.updateIntegration(
      req.user.id,
      integration,
      true, // Enable the integration when updating config
      config
    );

    res.json(updated);
  } catch (error) {
    console.error('Update integration config error:', error);
    res.status(500).json({ error: 'Failed to update integration configuration' });
  }
});

// Test integration connection
router.post('/:integration/test', authenticateToken, async (req, res) => {
  try {
    const { integration } = req.params;
    const { config } = req.body;

    // First validate the configuration
    const isValid = await integrationManager.validateIntegrationConfig(integration, config);
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid integration configuration' });
    }

    // Try to execute a simple action to test the connection
    await integrationManager.executeIntegrationAction(
      req.user.id,
      integration,
      'test',
      config
    );

    res.json({ success: true, message: 'Integration test successful' });
  } catch (error) {
    console.error('Test integration error:', error);
    res.status(400).json({
      success: false,
      error: 'Integration test failed',
      details: error.message
    });
  }
});

// Execute integration action
router.post('/:integration/action/:action', authenticateToken, async (req, res) => {
  try {
    const { integration, action } = req.params;
    const { params } = req.body;

    const result = await integrationManager.executeIntegrationAction(
      req.user.id,
      integration,
      action,
      ...params
    );

    res.json(result);
  } catch (error) {
    console.error('Execute integration action error:', error);
    res.status(500).json({
      error: 'Failed to execute integration action',
      details: error.message
    });
  }
});

module.exports = router;

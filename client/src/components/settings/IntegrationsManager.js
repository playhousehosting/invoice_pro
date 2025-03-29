import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Switch,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CircularProgress
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SettingsIcon from '@mui/icons-material/Settings';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';

const IntegrationsManager = () => {
  const [availableIntegrations, setAvailableIntegrations] = useState({});
  const [userIntegrations, setUserIntegrations] = useState(null);
  const [configDialog, setConfigDialog] = useState({
    open: false,
    integration: null,
    category: null
  });
  const [configValues, setConfigValues] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const fetchIntegrations = async () => {
    try {
      setLoading(true);
      const [availableRes, userRes] = await Promise.all([
        axios.get('/api/integrations/available'),
        axios.get('/api/integrations/user')
      ]);
      setAvailableIntegrations(availableRes.data);
      setUserIntegrations(userRes.data);
    } catch (err) {
      setError('Failed to load integrations');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (integration, category, enabled) => {
    try {
      if (enabled) {
        // Open config dialog when enabling
        setConfigDialog({
          open: true,
          integration,
          category
        });
      } else {
        // Directly disable without config
        await updateIntegration(integration, false, null);
      }
    } catch (err) {
      setError('Failed to toggle integration');
      console.error(err);
    }
  };

  const updateIntegration = async (integration, enabled, config = null) => {
    try {
      await axios.post(`/api/integrations/${integration}/toggle`, {
        enabled,
        config
      });
      await fetchIntegrations();
      setSuccess(`Successfully ${enabled ? 'enabled' : 'disabled'} ${integration}`);
    } catch (err) {
      setError(`Failed to ${enabled ? 'enable' : 'disable'} ${integration}`);
      console.error(err);
    }
  };

  const handleConfigSubmit = async () => {
    const { integration } = configDialog;
    try {
      // Test connection first
      await axios.post(`/api/integrations/${integration}/test`, {
        config: configValues
      });

      // If test successful, update integration
      await updateIntegration(integration, true, configValues);
      setConfigDialog({ open: false, integration: null, category: null });
      setConfigValues({});
    } catch (err) {
      setError('Failed to configure integration: ' + err.response?.data?.details || err.message);
    }
  };

  const handleConfigChange = (field) => (event) => {
    setConfigValues(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Integrations
      </Typography>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" onClose={() => setSuccess(null)} sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      {Object.entries(availableIntegrations).map(([category, integrations]) => (
        <Accordion key={category} defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6" sx={{ textTransform: 'capitalize' }}>
              {category} Integrations
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={3}>
              {integrations.map((integration) => {
                const isEnabled = userIntegrations?.[`${integration.name}_enabled`];
                const hasConfig = userIntegrations?.[`${integration.name}_config`];

                return (
                  <Grid item xs={12} md={6} key={integration.name}>
                    <Card>
                      <CardContent>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Typography variant="h6">{integration.label}</Typography>
                          <Switch
                            checked={isEnabled}
                            onChange={(e) => handleToggle(integration.name, category, e.target.checked)}
                            color="primary"
                          />
                        </Box>
                        
                        <Typography color="textSecondary" variant="body2" sx={{ mt: 1 }}>
                          {integration.description}
                        </Typography>

                        <Box display="flex" alignItems="center" mt={2}>
                          {isEnabled ? (
                            <>
                              <CheckCircleIcon color="success" sx={{ mr: 1 }} />
                              <Typography color="success.main">Connected</Typography>
                            </>
                          ) : (
                            <>
                              <ErrorIcon color="error" sx={{ mr: 1 }} />
                              <Typography color="error">Not Connected</Typography>
                            </>
                          )}
                        </Box>

                        {isEnabled && (
                          <Button
                            startIcon={<SettingsIcon />}
                            onClick={() => setConfigDialog({
                              open: true,
                              integration: integration.name,
                              category
                            })}
                            sx={{ mt: 2 }}
                          >
                            Configure
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          </AccordionDetails>
        </Accordion>
      ))}

      <Dialog
        open={configDialog.open}
        onClose={() => setConfigDialog({ open: false, integration: null, category: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Configure {configDialog.integration} Integration
        </DialogTitle>
        <DialogContent>
          {configDialog.integration && availableIntegrations[configDialog.category]?.find(
            i => i.name === configDialog.integration
          )?.requiredFields.map(field => (
            <TextField
              key={field}
              label={field.split(/(?=[A-Z])/).join(' ')}
              variant="outlined"
              fullWidth
              margin="normal"
              type={field.toLowerCase().includes('password') || field.toLowerCase().includes('secret') ? 'password' : 'text'}
              value={configValues[field] || ''}
              onChange={handleConfigChange(field)}
            />
          ))}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setConfigDialog({ open: false, integration: null, category: null })}
            color="primary"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfigSubmit}
            color="primary"
            variant="contained"
          >
            Save Configuration
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default IntegrationsManager;

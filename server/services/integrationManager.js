const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Import all integration services with error handling
let salesforceService;
try {
  salesforceService = require('./crm/salesforce');
} catch (error) {
  console.warn('Salesforce integration is not available:', error.message);
  salesforceService = null;
}

let hubspotService;
try {
  hubspotService = require('./crm/hubspot');
} catch (error) {
  console.warn('HubSpot integration is not available:', error.message);
  hubspotService = null;
}

let zohoService;
try {
  zohoService = require('./crm/zoho');
} catch (error) {
  console.warn('Zoho integration is not available:', error.message);
  zohoService = null;
}

let googleDriveService;
try {
  googleDriveService = require('./storage/googleDrive');
} catch (error) {
  console.warn('Google Drive integration is not available:', error.message);
  googleDriveService = null;
}

let dropboxService;
try {
  dropboxService = require('./storage/dropbox');
} catch (error) {
  console.warn('Dropbox integration is not available:', error.message);
  dropboxService = null;
}

let oneDriveService;
try {
  oneDriveService = require('./storage/oneDrive');
} catch (error) {
  console.warn('OneDrive integration is not available:', error.message);
  oneDriveService = null;
}

let docuSignService;
try {
  docuSignService = require('./documents/docuSign');
} catch (error) {
  console.warn('DocuSign integration is not available:', error.message);
  docuSignService = null;
}

let emailService;
try {
  emailService = require('./communication/email');
} catch (error) {
  console.warn('Email integration is not available:', error.message);
  emailService = null;
}

let smsService;
try {
  smsService = require('./communication/sms');
} catch (error) {
  console.warn('SMS integration is not available:', error.message);
  smsService = null;
}

class IntegrationManager {
  constructor() {
    this.services = {
      ...(salesforceService && { salesforce: salesforceService }),
      ...(hubspotService && { hubspot: hubspotService }),
      ...(zohoService && { zoho: zohoService }),
      ...(googleDriveService && { googleDrive: googleDriveService }),
      ...(dropboxService && { dropbox: dropboxService }),
      ...(oneDriveService && { oneDrive: oneDriveService }),
      ...(docuSignService && { docuSign: docuSignService }),
      ...(emailService && { email: emailService }),
      ...(smsService && { sms: smsService })
    };

    // Log available integrations
    const availableIntegrations = Object.keys(this.services);
    console.log('Available integrations:', availableIntegrations);
  }

  async getUserIntegrations(userId) {
    try {
      const userIntegrations = await prisma.userIntegrations.findUnique({
        where: { userId }
      });
      return userIntegrations || await this.createDefaultIntegrations(userId);
    } catch (error) {
      console.error('Get user integrations error:', error);
      throw error;
    }
  }

  async createDefaultIntegrations(userId) {
    try {
      return await prisma.userIntegrations.create({
        data: { userId }
      });
    } catch (error) {
      console.error('Create default integrations error:', error);
      throw error;
    }
  }

  async updateIntegration(userId, integrationName, enabled, config = null) {
    try {
      const updateData = {
        [`${integrationName}_enabled`]: enabled
      };

      if (config) {
        updateData[`${integrationName}_config`] = config;
      }

      return await prisma.userIntegrations.update({
        where: { userId },
        data: updateData
      });
    } catch (error) {
      console.error('Update integration error:', error);
      throw error;
    }
  }

  async isIntegrationEnabled(userId, integrationName) {
    try {
      const integrations = await this.getUserIntegrations(userId);
      return integrations[`${integrationName}_enabled`] || false;
    } catch (error) {
      console.error('Check integration status error:', error);
      throw error;
    }
  }

  async getIntegrationConfig(userId, integrationName) {
    try {
      const integrations = await this.getUserIntegrations(userId);
      return integrations[`${integrationName}_config`] || null;
    } catch (error) {
      console.error('Get integration config error:', error);
      throw error;
    }
  }

  async validateIntegrationConfig(integrationName, config) {
    // Add validation logic for each integration type
    switch (integrationName) {
      case 'salesforce':
        return this.validateSalesforceConfig(config);
      case 'hubspot':
        return this.validateHubspotConfig(config);
      case 'zoho':
        return this.validateZohoConfig(config);
      // Add more validation cases for other integrations
      default:
        return true;
    }
  }

  validateSalesforceConfig(config) {
    const required = ['username', 'password', 'securityToken'];
    return required.every(field => config[field]);
  }

  validateHubspotConfig(config) {
    return config.apiKey && typeof config.apiKey === 'string';
  }

  validateZohoConfig(config) {
    const required = ['clientId', 'clientSecret', 'refreshToken'];
    return required.every(field => config[field]);
  }

  async getAvailableIntegrations() {
    return {
      crm: [
        {
          name: 'salesforce',
          label: 'Salesforce',
          description: 'Connect with Salesforce CRM',
          requiredFields: ['username', 'password', 'securityToken']
        },
        {
          name: 'hubspot',
          label: 'HubSpot',
          description: 'Integrate with HubSpot CRM',
          requiredFields: ['apiKey']
        },
        {
          name: 'zoho',
          label: 'Zoho',
          description: 'Connect with Zoho CRM',
          requiredFields: ['clientId', 'clientSecret', 'refreshToken']
        }
      ],
      storage: [
        {
          name: 'googleDrive',
          label: 'Google Drive',
          description: 'Store files in Google Drive',
          requiredFields: ['clientId', 'clientSecret', 'refreshToken']
        },
        {
          name: 'dropbox',
          label: 'Dropbox',
          description: 'Connect with Dropbox storage',
          requiredFields: ['accessToken']
        },
        {
          name: 'oneDrive',
          label: 'OneDrive',
          description: 'Store files in OneDrive',
          requiredFields: ['clientId', 'clientSecret', 'tenantId']
        }
      ],
      documents: [
        {
          name: 'docuSign',
          label: 'DocuSign',
          description: 'Electronic signature integration',
          requiredFields: ['integrationKey', 'userId', 'accountId']
        }
      ],
      communication: [
        {
          name: 'email',
          label: 'Email Service',
          description: 'Send emails via SendGrid or Mailgun',
          providers: [
            {
              name: 'sendgrid',
              label: 'SendGrid',
              requiredFields: ['apiKey']
            },
            {
              name: 'mailgun',
              label: 'Mailgun',
              requiredFields: ['apiKey', 'domain']
            }
          ]
        },
        {
          name: 'sms',
          label: 'SMS Service',
          description: 'Send SMS via Twilio',
          requiredFields: ['accountSid', 'authToken', 'phoneNumber']
        }
      ]
    };
  }

  async executeIntegrationAction(userId, integrationName, action, ...args) {
    try {
      // Check if integration is enabled
      const isEnabled = await this.isIntegrationEnabled(userId, integrationName);
      if (!isEnabled) {
        throw new Error(`Integration ${integrationName} is not enabled for this user`);
      }

      // Get integration config
      const config = await this.getIntegrationConfig(userId, integrationName);
      if (!config) {
        throw new Error(`No configuration found for ${integrationName}`);
      }

      // Get the service instance
      const service = this.services[integrationName];
      if (!service) {
        throw new Error(`Service not found for ${integrationName}`);
      }

      // Initialize the service with the config if needed
      if (service.initialize) {
        await service.initialize(config);
      }

      // Execute the requested action
      if (typeof service[action] !== 'function') {
        throw new Error(`Action ${action} not supported by ${integrationName}`);
      }

      return await service[action](...args);
    } catch (error) {
      console.error(`Integration action error (${integrationName}.${action}):`, error);
      throw error;
    }
  }
}

module.exports = new IntegrationManager();

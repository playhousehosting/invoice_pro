const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Import all integration services
let salesforceService;
try {
  salesforceService = require('./crm/salesforce');
} catch (error) {
  console.warn('Salesforce integration is not available:', error.message);
  salesforceService = null;
}

const hubspotService = require('./crm/hubspot');
const zohoService = require('./crm/zoho');
const googleDriveService = require('./storage/googleDrive');
const dropboxService = require('./storage/dropbox');
const oneDriveService = require('./storage/oneDrive');
const docuSignService = require('./documents/docuSign');
const emailService = require('./communication/email');
const smsService = require('./communication/sms');

class IntegrationManager {
  constructor() {
    this.services = {
      ...(salesforceService && { salesforce: salesforceService }),
      hubspot: hubspotService,
      zoho: zohoService,
      googleDrive: googleDriveService,
      dropbox: dropboxService,
      oneDrive: oneDriveService,
      docuSign: docuSignService,
      email: emailService,
      sms: smsService
    };
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

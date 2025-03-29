// Payment Processing
const stripeService = require('./payment/stripe');
const paypalService = require('./payment/paypal');

// Email Services
const emailService = require('./communication/email');
const smsService = require('./communication/sms');
const slackService = require('./communication/slack');

// Cloud Storage
const googleDriveService = require('./storage/googleDrive');
const dropboxService = require('./storage/dropbox');
const oneDriveService = require('./storage/oneDrive');

// Document Services
const docuSignService = require('./documents/docuSign');
const pdfService = require('./documents/pdf');

// CRM
const salesforceService = require('./crm/salesforce');
const hubspotService = require('./crm/hubspot');
const zohoService = require('./crm/zoho');

// Accounting
const quickbooksService = require('./accounting/quickbooks');
const xeroService = require('./accounting/xero');
const freshbooksService = require('./accounting/freshbooks');

// Time Tracking
const togglService = require('./timeTracking/toggl');
const harvestService = require('./timeTracking/harvest');

// Tax Services
const avalaraService = require('./tax/avalara');

// Analytics
const analyticsService = require('./analytics/googleAnalytics');

module.exports = {
  payment: {
    stripe: stripeService,
    paypal: paypalService
  },
  communication: {
    email: emailService,
    sms: smsService,
    slack: slackService
  },
  storage: {
    googleDrive: googleDriveService,
    dropbox: dropboxService,
    oneDrive: oneDriveService
  },
  documents: {
    docuSign: docuSignService,
    pdf: pdfService
  },
  crm: {
    salesforce: salesforceService,
    hubspot: hubspotService,
    zoho: zohoService
  },
  accounting: {
    quickbooks: quickbooksService,
    xero: xeroService,
    freshbooks: freshbooksService
  },
  timeTracking: {
    toggl: togglService,
    harvest: harvestService
  },
  tax: {
    avalara: avalaraService
  },
  analytics: {
    google: analyticsService
  }
};

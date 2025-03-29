const jsforce = require('jsforce');

class SalesforceService {
  constructor() {
    this.conn = new jsforce.Connection({
      loginUrl: process.env.SALESFORCE_LOGIN_URL || 'https://login.salesforce.com'
    });
  }

  async authenticate(username, password, securityToken) {
    try {
      await this.conn.login(username, password + securityToken);
      return this.conn;
    } catch (error) {
      console.error('Salesforce authentication error:', error);
      throw error;
    }
  }

  async authenticateWithOAuth(accessToken, instanceUrl) {
    try {
      this.conn = new jsforce.Connection({
        instanceUrl,
        accessToken
      });
      return this.conn;
    } catch (error) {
      console.error('Salesforce OAuth authentication error:', error);
      throw error;
    }
  }

  async createAccount(accountData) {
    try {
      const account = await this.conn.sobject('Account').create({
        Name: accountData.name,
        BillingStreet: accountData.billingAddress?.street,
        BillingCity: accountData.billingAddress?.city,
        BillingState: accountData.billingAddress?.state,
        BillingPostalCode: accountData.billingAddress?.postalCode,
        BillingCountry: accountData.billingAddress?.country,
        Phone: accountData.phone,
        Website: accountData.website,
        Industry: accountData.industry,
        Description: accountData.description
      });

      return account;
    } catch (error) {
      console.error('Salesforce create account error:', error);
      throw error;
    }
  }

  async createContact(contactData) {
    try {
      const contact = await this.conn.sobject('Contact').create({
        FirstName: contactData.firstName,
        LastName: contactData.lastName,
        Email: contactData.email,
        Phone: contactData.phone,
        AccountId: contactData.accountId,
        Title: contactData.title,
        MailingStreet: contactData.address?.street,
        MailingCity: contactData.address?.city,
        MailingState: contactData.address?.state,
        MailingPostalCode: contactData.address?.postalCode,
        MailingCountry: contactData.address?.country
      });

      return contact;
    } catch (error) {
      console.error('Salesforce create contact error:', error);
      throw error;
    }
  }

  async createOpportunity(opportunityData) {
    try {
      const opportunity = await this.conn.sobject('Opportunity').create({
        Name: opportunityData.name,
        AccountId: opportunityData.accountId,
        Amount: opportunityData.amount,
        CloseDate: opportunityData.closeDate,
        StageName: opportunityData.stageName,
        Description: opportunityData.description,
        Type: opportunityData.type
      });

      return opportunity;
    } catch (error) {
      console.error('Salesforce create opportunity error:', error);
      throw error;
    }
  }

  async syncInvoice(invoice) {
    try {
      // Create custom object for invoice if it doesn't exist
      const invoiceObject = await this.conn.sobject('Invoice__c').create({
        Name: `INV-${invoice.number}`,
        Invoice_Number__c: invoice.number,
        Account__c: invoice.accountId,
        Amount__c: invoice.total,
        Due_Date__c: invoice.dueDate,
        Status__c: invoice.status,
        Description__c: invoice.description
      });

      // Create invoice line items
      const lineItems = await Promise.all(
        invoice.items.map(item =>
          this.conn.sobject('Invoice_Line_Item__c').create({
            Invoice__c: invoiceObject.id,
            Product_Name__c: item.name,
            Description__c: item.description,
            Quantity__c: item.quantity,
            Unit_Price__c: item.rate,
            Total_Amount__c: item.amount
          })
        )
      );

      return {
        invoice: invoiceObject,
        lineItems
      };
    } catch (error) {
      console.error('Salesforce sync invoice error:', error);
      throw error;
    }
  }

  async updateInvoiceStatus(invoiceId, status) {
    try {
      const result = await this.conn.sobject('Invoice__c').update({
        Id: invoiceId,
        Status__c: status
      });

      return result;
    } catch (error) {
      console.error('Salesforce update invoice status error:', error);
      throw error;
    }
  }

  async searchAccounts(query) {
    try {
      const results = await this.conn.search(
        `FIND {${query}} IN ALL FIELDS RETURNING Account (Id, Name, BillingAddress, Phone, Website)`
      );
      return results.searchRecords;
    } catch (error) {
      console.error('Salesforce search accounts error:', error);
      throw error;
    }
  }

  async searchContacts(query) {
    try {
      const results = await this.conn.search(
        `FIND {${query}} IN ALL FIELDS RETURNING Contact (Id, FirstName, LastName, Email, Phone, MailingAddress)`
      );
      return results.searchRecords;
    } catch (error) {
      console.error('Salesforce search contacts error:', error);
      throw error;
    }
  }

  async getAccountInvoices(accountId) {
    try {
      const invoices = await this.conn.sobject('Invoice__c')
        .find({ Account__c: accountId })
        .execute();

      return invoices;
    } catch (error) {
      console.error('Salesforce get account invoices error:', error);
      throw error;
    }
  }

  async createTask(taskData) {
    try {
      const task = await this.conn.sobject('Task').create({
        Subject: taskData.subject,
        WhatId: taskData.relatedToId,
        WhoId: taskData.contactId,
        Status: taskData.status,
        Priority: taskData.priority,
        Description: taskData.description,
        ActivityDate: taskData.dueDate
      });

      return task;
    } catch (error) {
      console.error('Salesforce create task error:', error);
      throw error;
    }
  }

  async getReports() {
    try {
      const reports = await this.conn.analytics.reports();
      return reports;
    } catch (error) {
      console.error('Salesforce get reports error:', error);
      throw error;
    }
  }

  async runReport(reportId) {
    try {
      const report = await this.conn.analytics.report(reportId).execute();
      return report;
    } catch (error) {
      console.error('Salesforce run report error:', error);
      throw error;
    }
  }

  async query(soql) {
    try {
      const results = await this.conn.query(soql);
      return results;
    } catch (error) {
      console.error('Salesforce query error:', error);
      throw error;
    }
  }

  async createCustomObject(objectName, fields) {
    try {
      const metadata = {
        fullName: objectName,
        label: objectName,
        pluralLabel: `${objectName}s`,
        nameField: {
          type: 'Text',
          label: 'Name'
        },
        deploymentStatus: 'Deployed',
        sharingModel: 'ReadWrite',
        fields: fields.map(field => ({
          fullName: `${field.name}__c`,
          label: field.label,
          type: field.type,
          required: field.required || false
        }))
      };

      const result = await this.conn.metadata.create('CustomObject', metadata);
      return result;
    } catch (error) {
      console.error('Salesforce create custom object error:', error);
      throw error;
    }
  }
}

module.exports = new SalesforceService();

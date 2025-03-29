const { XeroClient } = require('xero-node');

class XeroService {
  constructor() {
    this.xero = new XeroClient({
      clientId: process.env.XERO_CLIENT_ID,
      clientSecret: process.env.XERO_CLIENT_SECRET,
      redirectUris: [`${process.env.APP_URL}/api/accounting/xero/callback`],
      scopes: ['offline_access', 'accounting.transactions', 'accounting.contacts', 'accounting.settings']
    });
  }

  initialize(config) {
    this.xero.setTokenSet({
      access_token: config.accessToken,
      refresh_token: config.refreshToken,
      expires_at: config.expiresAt
    });
    this.tenantId = config.tenantId;
  }

  getAuthUrl() {
    return this.xero.buildConsentUrl();
  }

  async handleCallback(url) {
    try {
      const tokenSet = await this.xero.apiCallback(url);
      const tenants = await this.xero.updateTenants();
      
      return {
        accessToken: tokenSet.access_token,
        refreshToken: tokenSet.refresh_token,
        expiresAt: tokenSet.expires_at,
        tenantId: tenants[0].tenantId
      };
    } catch (error) {
      console.error('Xero callback error:', error);
      throw error;
    }
  }

  async syncContact(contactData) {
    try {
      const contact = {
        Name: contactData.name,
        EmailAddress: contactData.email,
        Phones: [{
          PhoneType: 'DEFAULT',
          PhoneNumber: contactData.phone
        }],
        Addresses: [{
          AddressType: 'STREET',
          AddressLine1: contactData.address?.street,
          City: contactData.address?.city,
          Region: contactData.address?.state,
          PostalCode: contactData.address?.postalCode,
          Country: contactData.address?.country
        }]
      };

      const response = await this.xero.accountingApi.createContact(
        this.tenantId,
        { Contacts: [contact] }
      );

      return response.body.Contacts[0];
    } catch (error) {
      console.error('Xero create contact error:', error);
      throw error;
    }
  }

  async syncInvoice(invoice) {
    try {
      const invoiceData = {
        Type: 'ACCREC',
        Contact: {
          ContactID: invoice.contactId
        },
        Date: invoice.date,
        DueDate: invoice.dueDate,
        InvoiceNumber: invoice.number,
        Reference: invoice.reference,
        Status: 'SUBMITTED',
        LineItems: invoice.items.map(item => ({
          Description: item.description,
          Quantity: item.quantity,
          UnitAmount: item.rate,
          AccountCode: item.accountCode || '200'
        }))
      };

      const response = await this.xero.accountingApi.createInvoices(
        this.tenantId,
        { Invoices: [invoiceData] }
      );

      return response.body.Invoices[0];
    } catch (error) {
      console.error('Xero create invoice error:', error);
      throw error;
    }
  }

  async updateInvoiceStatus(invoiceId, status) {
    try {
      const response = await this.xero.accountingApi.updateInvoice(
        this.tenantId,
        invoiceId,
        {
          Invoices: [{
            InvoiceID: invoiceId,
            Status: status
          }]
        }
      );

      return response.body.Invoices[0];
    } catch (error) {
      console.error('Xero update invoice status error:', error);
      throw error;
    }
  }

  async createPayment(paymentData) {
    try {
      const payment = {
        Invoice: {
          InvoiceID: paymentData.invoiceId
        },
        Account: {
          AccountID: paymentData.accountId
        },
        Amount: paymentData.amount,
        Date: paymentData.date,
        Reference: paymentData.reference
      };

      const response = await this.xero.accountingApi.createPayment(
        this.tenantId,
        { Payments: [payment] }
      );

      return response.body.Payments[0];
    } catch (error) {
      console.error('Xero create payment error:', error);
      throw error;
    }
  }

  async getAccounts() {
    try {
      const response = await this.xero.accountingApi.getAccounts(this.tenantId);
      return response.body.Accounts;
    } catch (error) {
      console.error('Xero get accounts error:', error);
      throw error;
    }
  }

  async getTaxRates() {
    try {
      const response = await this.xero.accountingApi.getTaxRates(this.tenantId);
      return response.body.TaxRates;
    } catch (error) {
      console.error('Xero get tax rates error:', error);
      throw error;
    }
  }

  async createItem(itemData) {
    try {
      const item = {
        Code: itemData.code,
        Name: itemData.name,
        Description: itemData.description,
        PurchaseDetails: {
          UnitPrice: itemData.purchasePrice,
          AccountCode: itemData.purchaseAccountCode
        },
        SalesDetails: {
          UnitPrice: itemData.salesPrice,
          AccountCode: itemData.salesAccountCode
        }
      };

      const response = await this.xero.accountingApi.createItems(
        this.tenantId,
        { Items: [item] }
      );

      return response.body.Items[0];
    } catch (error) {
      console.error('Xero create item error:', error);
      throw error;
    }
  }

  async getReports(reportName) {
    try {
      const response = await this.xero.accountingApi.getReportProfitAndLoss(
        this.tenantId
      );
      return response.body;
    } catch (error) {
      console.error('Xero get reports error:', error);
      throw error;
    }
  }

  async createBankTransaction(transactionData) {
    try {
      const transaction = {
        Type: transactionData.type,
        Contact: {
          ContactID: transactionData.contactId
        },
        Date: transactionData.date,
        LineItems: transactionData.items.map(item => ({
          Description: item.description,
          Quantity: item.quantity,
          UnitAmount: item.unitAmount,
          AccountCode: item.accountCode
        })),
        BankAccount: {
          AccountID: transactionData.bankAccountId
        }
      };

      const response = await this.xero.accountingApi.createBankTransactions(
        this.tenantId,
        { BankTransactions: [transaction] }
      );

      return response.body.BankTransactions[0];
    } catch (error) {
      console.error('Xero create bank transaction error:', error);
      throw error;
    }
  }

  async refreshTokens() {
    try {
      const tokenSet = await this.xero.refreshToken();
      return {
        accessToken: tokenSet.access_token,
        refreshToken: tokenSet.refresh_token,
        expiresAt: tokenSet.expires_at
      };
    } catch (error) {
      console.error('Xero refresh tokens error:', error);
      throw error;
    }
  }

  async test(config) {
    try {
      this.initialize(config);
      await this.getAccounts();
      return true;
    } catch (error) {
      console.error('Xero test connection error:', error);
      throw error;
    }
  }
}

module.exports = new XeroService();

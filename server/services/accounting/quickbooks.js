const OAuthClient = require('intuit-oauth');
const QuickBooks = require('node-quickbooks');

class QuickBooksService {
  constructor() {
    this.oauthClient = new OAuthClient({
      clientId: process.env.QUICKBOOKS_CLIENT_ID,
      clientSecret: process.env.QUICKBOOKS_CLIENT_SECRET,
      environment: process.env.NODE_ENV === 'production' ? 'production' : 'sandbox',
      redirectUri: `${process.env.APP_URL}/api/accounting/quickbooks/callback`
    });
  }

  initialize(config) {
    this.qbo = new QuickBooks(
      config.clientId,
      config.clientSecret,
      config.accessToken,
      false, // no token secret for oAuth 2.0
      config.realmId,
      config.sandbox === true, // use sandbox?
      true, // enable debugging?
      null, // set minorversion, or null for the latest
      '2.0', // oAuth version
      config.refreshToken
    );
  }

  getAuthUrl() {
    return this.oauthClient.authorizeUri({
      scope: [
        OAuthClient.scopes.Accounting,
        OAuthClient.scopes.OpenId,
        OAuthClient.scopes.Profile,
        OAuthClient.scopes.Email
      ],
      state: 'randomState'
    });
  }

  async handleCallback(url) {
    try {
      const authResponse = await this.oauthClient.createToken(url);
      const tokens = authResponse.getJson();
      return {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        realmId: tokens.realmId
      };
    } catch (error) {
      console.error('QuickBooks callback error:', error);
      throw error;
    }
  }

  async syncCustomer(customerData) {
    return new Promise((resolve, reject) => {
      const customer = {
        DisplayName: customerData.name,
        PrimaryEmailAddr: { Address: customerData.email },
        PrimaryPhone: { FreeFormNumber: customerData.phone },
        BillAddr: {
          Line1: customerData.address?.street,
          City: customerData.address?.city,
          CountrySubDivisionCode: customerData.address?.state,
          PostalCode: customerData.address?.postalCode,
          Country: customerData.address?.country
        }
      };

      this.qbo.createCustomer(customer, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  }

  async syncInvoice(invoice) {
    return new Promise((resolve, reject) => {
      const invoiceObj = {
        DocNumber: invoice.number,
        CustomerRef: {
          value: invoice.customerId
        },
        DueDate: invoice.dueDate,
        Line: invoice.items.map(item => ({
          Description: item.description,
          Amount: item.amount,
          DetailType: 'SalesItemLineDetail',
          SalesItemLineDetail: {
            Qty: item.quantity,
            UnitPrice: item.rate
          }
        })),
        CustomerMemo: {
          value: invoice.notes
        }
      };

      this.qbo.createInvoice(invoiceObj, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  }

  async getInvoice(invoiceId) {
    return new Promise((resolve, reject) => {
      this.qbo.getInvoice(invoiceId, (err, invoice) => {
        if (err) reject(err);
        else resolve(invoice);
      });
    });
  }

  async updateInvoiceStatus(invoiceId, status) {
    return new Promise((resolve, reject) => {
      this.qbo.getInvoice(invoiceId, (err, invoice) => {
        if (err) {
          reject(err);
          return;
        }

        invoice.CustomField = [{
          DefinitionId: 1,
          Name: 'Status',
          Type: 'StringType',
          StringValue: status
        }];

        this.qbo.updateInvoice(invoice, (err, updatedInvoice) => {
          if (err) reject(err);
          else resolve(updatedInvoice);
        });
      });
    });
  }

  async createPayment(paymentData) {
    return new Promise((resolve, reject) => {
      const payment = {
        CustomerRef: {
          value: paymentData.customerId
        },
        TotalAmt: paymentData.amount,
        Line: [{
          Amount: paymentData.amount,
          LinkedTxn: [{
            TxnId: paymentData.invoiceId,
            TxnType: 'Invoice'
          }]
        }]
      };

      this.qbo.createPayment(payment, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  }

  async syncProduct(productData) {
    return new Promise((resolve, reject) => {
      const item = {
        Name: productData.name,
        Description: productData.description,
        UnitPrice: productData.price,
        Type: 'Service',
        IncomeAccountRef: {
          value: productData.incomeAccountId
        }
      };

      this.qbo.createItem(item, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  }

  async getReports(reportType, options = {}) {
    return new Promise((resolve, reject) => {
      this.qbo.report(reportType, options, (err, report) => {
        if (err) reject(err);
        else resolve(report);
      });
    });
  }

  async searchTransactions(query) {
    return new Promise((resolve, reject) => {
      this.qbo.findTransactions(query, (err, transactions) => {
        if (err) reject(err);
        else resolve(transactions);
      });
    });
  }

  async getAccounts() {
    return new Promise((resolve, reject) => {
      this.qbo.findAccounts({
        Active: true
      }, (err, accounts) => {
        if (err) reject(err);
        else resolve(accounts);
      });
    });
  }

  async createJournalEntry(entryData) {
    return new Promise((resolve, reject) => {
      const journalEntry = {
        DocNumber: entryData.number,
        TxnDate: entryData.date,
        Line: entryData.lines.map(line => ({
          Description: line.description,
          Amount: line.amount,
          DetailType: 'JournalEntryLineDetail',
          JournalEntryLineDetail: {
            PostingType: line.type,
            AccountRef: {
              value: line.accountId
            }
          }
        }))
      };

      this.qbo.createJournalEntry(journalEntry, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  }

  async refreshTokens() {
    try {
      const authResponse = await this.oauthClient.refresh();
      const tokens = authResponse.getJson();
      return {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token
      };
    } catch (error) {
      console.error('QuickBooks refresh tokens error:', error);
      throw error;
    }
  }

  async test(config) {
    try {
      this.initialize(config);
      await this.getAccounts();
      return true;
    } catch (error) {
      console.error('QuickBooks test connection error:', error);
      throw error;
    }
  }
}

module.exports = new QuickBooksService();

const Avatax = require('avatax');

class AvalaraService {
  constructor() {
    this.environment = process.env.NODE_ENV === 'production' ? 'production' : 'sandbox';
  }

  initialize(config) {
    this.client = new Avatax({
      appName: 'InvoiceApp',
      appVersion: '1.0',
      environment: this.environment,
      machineName: 'invoice-server',
      timeout: 5000
    }).withSecurity({
      username: config.username,
      password: config.password
    });

    this.companyCode = config.companyCode;
  }

  async createCompany(companyData) {
    try {
      const company = {
        name: companyData.name,
        companyCode: companyData.companyCode,
        taxpayerIdNumber: companyData.taxId,
        line1: companyData.address?.street,
        city: companyData.address?.city,
        region: companyData.address?.state,
        postalCode: companyData.address?.postalCode,
        country: companyData.address?.country || 'US',
        isActive: true
      };

      return await this.client.api.companies.createCompany({ model: company });
    } catch (error) {
      console.error('Avalara create company error:', error);
      throw error;
    }
  }

  async createTransaction(transactionData) {
    try {
      const transaction = {
        type: 'SalesInvoice',
        companyCode: this.companyCode,
        date: transactionData.date || new Date().toISOString().split('T')[0],
        customerCode: transactionData.customerCode,
        purchaseOrderNo: transactionData.purchaseOrderNo,
        addresses: {
          ShipFrom: {
            line1: transactionData.shipFrom.street,
            city: transactionData.shipFrom.city,
            region: transactionData.shipFrom.state,
            country: transactionData.shipFrom.country,
            postalCode: transactionData.shipFrom.postalCode
          },
          ShipTo: {
            line1: transactionData.shipTo.street,
            city: transactionData.shipTo.city,
            region: transactionData.shipTo.state,
            country: transactionData.shipTo.country,
            postalCode: transactionData.shipTo.postalCode
          }
        },
        lines: transactionData.lines.map((line, index) => ({
          number: (index + 1).toString(),
          quantity: line.quantity,
          amount: line.amount,
          itemCode: line.itemCode,
          description: line.description,
          taxCode: line.taxCode || 'P0000000',
          addresses: {
            ShipFrom: {
              line1: transactionData.shipFrom.street,
              city: transactionData.shipFrom.city,
              region: transactionData.shipFrom.state,
              country: transactionData.shipFrom.country,
              postalCode: transactionData.shipFrom.postalCode
            },
            ShipTo: {
              line1: transactionData.shipTo.street,
              city: transactionData.shipTo.city,
              region: transactionData.shipTo.state,
              country: transactionData.shipTo.country,
              postalCode: transactionData.shipTo.postalCode
            }
          }
        })),
        commit: transactionData.commit || false,
        currencyCode: transactionData.currencyCode || 'USD',
        description: transactionData.description
      };

      return await this.client.api.transactions.createTransaction({ model: transaction });
    } catch (error) {
      console.error('Avalara create transaction error:', error);
      throw error;
    }
  }

  async commitTransaction(transactionCode) {
    try {
      return await this.client.api.transactions.commitTransaction({
        companyCode: this.companyCode,
        transactionCode: transactionCode
      });
    } catch (error) {
      console.error('Avalara commit transaction error:', error);
      throw error;
    }
  }

  async voidTransaction(transactionCode, reason = 'DocVoided') {
    try {
      return await this.client.api.transactions.voidTransaction({
        companyCode: this.companyCode,
        transactionCode: transactionCode,
        model: {
          code: reason
        }
      });
    } catch (error) {
      console.error('Avalara void transaction error:', error);
      throw error;
    }
  }

  async calculateTax(addressData) {
    try {
      return await this.client.api.taxRates.byAddress({
        line1: addressData.street,
        city: addressData.city,
        region: addressData.state,
        postalCode: addressData.postalCode,
        country: addressData.country || 'US'
      });
    } catch (error) {
      console.error('Avalara calculate tax error:', error);
      throw error;
    }
  }

  async validateAddress(addressData) {
    try {
      const address = {
        line1: addressData.street,
        city: addressData.city,
        region: addressData.state,
        postalCode: addressData.postalCode,
        country: addressData.country || 'US'
      };

      return await this.client.api.addresses.resolve({ model: address });
    } catch (error) {
      console.error('Avalara validate address error:', error);
      throw error;
    }
  }

  async createCustomer(customerData) {
    try {
      const customer = {
        companyCode: this.companyCode,
        customerCode: customerData.code,
        name: customerData.name,
        emailAddress: customerData.email,
        line1: customerData.address?.street,
        city: customerData.address?.city,
        region: customerData.address?.state,
        postalCode: customerData.address?.postalCode,
        country: customerData.address?.country || 'US',
        customerVendorCode: customerData.taxNumber
      };

      return await this.client.api.customers.createCustomer({ model: customer });
    } catch (error) {
      console.error('Avalara create customer error:', error);
      throw error;
    }
  }

  async getTransaction(transactionCode) {
    try {
      return await this.client.api.transactions.getTransactionById({
        companyCode: this.companyCode,
        transactionCode: transactionCode
      });
    } catch (error) {
      console.error('Avalara get transaction error:', error);
      throw error;
    }
  }

  async listTransactions(params = {}) {
    try {
      return await this.client.api.transactions.listTransactions({
        companyCode: this.companyCode,
        ...params
      });
    } catch (error) {
      console.error('Avalara list transactions error:', error);
      throw error;
    }
  }

  async getTaxCodes() {
    try {
      return await this.client.api.definitions.listTaxCodes();
    } catch (error) {
      console.error('Avalara get tax codes error:', error);
      throw error;
    }
  }

  async createTaxRule(ruleData) {
    try {
      const rule = {
        companyCode: this.companyCode,
        taxCode: ruleData.taxCode,
        taxRuleTypeId: ruleData.ruleTypeId,
        taxRuleName: ruleData.name,
        jurisdictionTypeId: ruleData.jurisdictionTypeId,
        rate: ruleData.rate,
        isActive: true
      };

      return await this.client.api.taxRules.createTaxRule({ model: rule });
    } catch (error) {
      console.error('Avalara create tax rule error:', error);
      throw error;
    }
  }

  async test(config) {
    try {
      this.initialize(config);
      await this.client.api.ping();
      return true;
    } catch (error) {
      console.error('Avalara test connection error:', error);
      throw error;
    }
  }
}

module.exports = new AvalaraService();

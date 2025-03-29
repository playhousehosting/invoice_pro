const axios = require('axios');

class FreshBooksService {
  constructor() {
    this.baseURL = 'https://api.freshbooks.com';
    this.apiVersion = 'alpha';
  }

  initialize(config) {
    this.accessToken = config.accessToken;
    this.accountId = config.accountId;
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        'Api-Version': this.apiVersion
      }
    });
  }

  async makeRequest(method, endpoint, data = null) {
    try {
      const response = await this.client({
        method,
        url: endpoint,
        data
      });
      return response.data;
    } catch (error) {
      console.error('FreshBooks API request error:', error);
      throw error;
    }
  }

  async createClient(clientData) {
    try {
      const data = {
        client: {
          email: clientData.email,
          fname: clientData.firstName,
          lname: clientData.lastName,
          organization: clientData.company,
          p_street: clientData.address?.street,
          p_city: clientData.address?.city,
          p_state: clientData.address?.state,
          p_code: clientData.address?.postalCode,
          p_country: clientData.address?.country,
          phone: clientData.phone
        }
      };

      const response = await this.makeRequest(
        'post',
        `/accounting/account/${this.accountId}/users/clients`,
        data
      );

      return response.response.result.client;
    } catch (error) {
      console.error('FreshBooks create client error:', error);
      throw error;
    }
  }

  async createInvoice(invoice) {
    try {
      const data = {
        invoice: {
          customerid: invoice.clientId,
          create_date: invoice.date,
          due_date: invoice.dueDate,
          number: invoice.number,
          currency_code: invoice.currency || 'USD',
          status: 0, // 0 = draft
          notes: invoice.notes,
          terms: invoice.terms,
          lines: invoice.items.map(item => ({
            type: 0, // 0 = item
            name: item.name,
            description: item.description,
            qty: item.quantity,
            unit_cost: {
              amount: item.rate,
              code: invoice.currency || 'USD'
            }
          }))
        }
      };

      const response = await this.makeRequest(
        'post',
        `/accounting/account/${this.accountId}/invoices/invoices`,
        data
      );

      return response.response.result.invoice;
    } catch (error) {
      console.error('FreshBooks create invoice error:', error);
      throw error;
    }
  }

  async updateInvoiceStatus(invoiceId, status) {
    try {
      const data = {
        invoice: {
          status_name: status
        }
      };

      const response = await this.makeRequest(
        'put',
        `/accounting/account/${this.accountId}/invoices/invoices/${invoiceId}`,
        data
      );

      return response.response.result.invoice;
    } catch (error) {
      console.error('FreshBooks update invoice status error:', error);
      throw error;
    }
  }

  async createPayment(paymentData) {
    try {
      const data = {
        payment: {
          invoiceid: paymentData.invoiceId,
          amount: {
            amount: paymentData.amount,
            code: paymentData.currency || 'USD'
          },
          date: paymentData.date,
          type: paymentData.type || 1, // 1 = credit card
          note: paymentData.note
        }
      };

      const response = await this.makeRequest(
        'post',
        `/accounting/account/${this.accountId}/payments/payments`,
        data
      );

      return response.response.result.payment;
    } catch (error) {
      console.error('FreshBooks create payment error:', error);
      throw error;
    }
  }

  async createExpense(expenseData) {
    try {
      const data = {
        expense: {
          amount: {
            amount: expenseData.amount,
            code: expenseData.currency || 'USD'
          },
          date: expenseData.date,
          categoryid: expenseData.categoryId,
          notes: expenseData.notes,
          vendorid: expenseData.vendorId,
          staffid: expenseData.staffId
        }
      };

      const response = await this.makeRequest(
        'post',
        `/accounting/account/${this.accountId}/expenses/expenses`,
        data
      );

      return response.response.result.expense;
    } catch (error) {
      console.error('FreshBooks create expense error:', error);
      throw error;
    }
  }

  async getReports(reportType, options = {}) {
    try {
      const response = await this.makeRequest(
        'get',
        `/accounting/account/${this.accountId}/reports/accounting/${reportType}`,
        { params: options }
      );

      return response.response.result;
    } catch (error) {
      console.error('FreshBooks get reports error:', error);
      throw error;
    }
  }

  async createProject(projectData) {
    try {
      const data = {
        project: {
          title: projectData.title,
          description: projectData.description,
          due_date: projectData.dueDate,
          clientid: projectData.clientId,
          rate: projectData.rate,
          bill_method: projectData.billMethod || 'project-rate'
        }
      };

      const response = await this.makeRequest(
        'post',
        `/accounting/account/${this.accountId}/projects/projects`,
        data
      );

      return response.response.result.project;
    } catch (error) {
      console.error('FreshBooks create project error:', error);
      throw error;
    }
  }

  async trackTime(timeData) {
    try {
      const data = {
        time_entry: {
          projectid: timeData.projectId,
          taskid: timeData.taskId,
          note: timeData.note,
          started_at: timeData.startTime,
          duration: timeData.duration,
          is_logged: true
        }
      };

      const response = await this.makeRequest(
        'post',
        `/accounting/account/${this.accountId}/time_entries`,
        data
      );

      return response.response.result.time_entry;
    } catch (error) {
      console.error('FreshBooks track time error:', error);
      throw error;
    }
  }

  async getCategories() {
    try {
      const response = await this.makeRequest(
        'get',
        `/accounting/account/${this.accountId}/expenses/categories`
      );

      return response.response.result.categories;
    } catch (error) {
      console.error('FreshBooks get categories error:', error);
      throw error;
    }
  }

  async test(config) {
    try {
      this.initialize(config);
      await this.getCategories();
      return true;
    } catch (error) {
      console.error('FreshBooks test connection error:', error);
      throw error;
    }
  }
}

module.exports = new FreshBooksService();

const axios = require('axios');

class HarvestService {
  constructor() {
    this.baseURL = 'https://api.harvestapp.com/v2';
  }

  initialize(config) {
    this.accessToken = config.accessToken;
    this.accountId = config.accountId;
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Harvest-Account-ID': this.accountId,
        'User-Agent': 'InvoiceApp (support@invoiceapp.com)',
        'Content-Type': 'application/json'
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
      console.error('Harvest API request error:', error);
      throw error;
    }
  }

  async getCompany() {
    try {
      return await this.makeRequest('get', '/company');
    } catch (error) {
      console.error('Harvest get company error:', error);
      throw error;
    }
  }

  async createClient(clientData) {
    try {
      const data = {
        name: clientData.name,
        address: clientData.address,
        currency: clientData.currency || 'USD',
        is_active: true
      };

      return await this.makeRequest('post', '/clients', data);
    } catch (error) {
      console.error('Harvest create client error:', error);
      throw error;
    }
  }

  async createProject(projectData) {
    try {
      const data = {
        client_id: projectData.clientId,
        name: projectData.name,
        code: projectData.code,
        is_billable: projectData.billable || true,
        bill_by: projectData.billBy || 'Project',
        budget_by: projectData.budgetBy || 'project',
        budget: projectData.budget,
        notes: projectData.notes,
        starts_on: projectData.startDate,
        ends_on: projectData.endDate,
        is_active: true
      };

      return await this.makeRequest('post', '/projects', data);
    } catch (error) {
      console.error('Harvest create project error:', error);
      throw error;
    }
  }

  async createTask(taskData) {
    try {
      const data = {
        name: taskData.name,
        billable_by_default: taskData.billable || true,
        default_hourly_rate: taskData.rate,
        is_default: taskData.isDefault || false,
        is_active: true
      };

      return await this.makeRequest('post', '/tasks', data);
    } catch (error) {
      console.error('Harvest create task error:', error);
      throw error;
    }
  }

  async createTimeEntry(entryData) {
    try {
      const data = {
        project_id: entryData.projectId,
        task_id: entryData.taskId,
        spent_date: entryData.date || new Date().toISOString().split('T')[0],
        hours: entryData.hours,
        notes: entryData.notes,
        external_reference: entryData.reference
      };

      return await this.makeRequest('post', '/time_entries', data);
    } catch (error) {
      console.error('Harvest create time entry error:', error);
      throw error;
    }
  }

  async updateTimeEntry(timeEntryId, updateData) {
    try {
      return await this.makeRequest('patch', `/time_entries/${timeEntryId}`, updateData);
    } catch (error) {
      console.error('Harvest update time entry error:', error);
      throw error;
    }
  }

  async deleteTimeEntry(timeEntryId) {
    try {
      return await this.makeRequest('delete', `/time_entries/${timeEntryId}`);
    } catch (error) {
      console.error('Harvest delete time entry error:', error);
      throw error;
    }
  }

  async getTimeEntries(params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      return await this.makeRequest('get', `/time_entries?${queryString}`);
    } catch (error) {
      console.error('Harvest get time entries error:', error);
      throw error;
    }
  }

  async createInvoice(invoiceData) {
    try {
      const data = {
        client_id: invoiceData.clientId,
        subject: invoiceData.subject,
        due_date: invoiceData.dueDate,
        currency: invoiceData.currency || 'USD',
        payment_term: invoiceData.paymentTerm,
        line_items: invoiceData.lineItems.map(item => ({
          kind: item.kind,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          project_id: item.projectId
        }))
      };

      return await this.makeRequest('post', '/invoices', data);
    } catch (error) {
      console.error('Harvest create invoice error:', error);
      throw error;
    }
  }

  async getInvoices(params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      return await this.makeRequest('get', `/invoices?${queryString}`);
    } catch (error) {
      console.error('Harvest get invoices error:', error);
      throw error;
    }
  }

  async createExpense(expenseData) {
    try {
      const data = {
        project_id: expenseData.projectId,
        expense_category_id: expenseData.categoryId,
        spent_date: expenseData.date,
        total: expenseData.amount,
        notes: expenseData.notes,
        billable: expenseData.billable || true,
        receipt: expenseData.receipt
      };

      return await this.makeRequest('post', '/expenses', data);
    } catch (error) {
      console.error('Harvest create expense error:', error);
      throw error;
    }
  }

  async getExpenseCategories() {
    try {
      return await this.makeRequest('get', '/expense_categories');
    } catch (error) {
      console.error('Harvest get expense categories error:', error);
      throw error;
    }
  }

  async getProjectBudget(projectId) {
    try {
      return await this.makeRequest('get', `/projects/${projectId}/budget`);
    } catch (error) {
      console.error('Harvest get project budget error:', error);
      throw error;
    }
  }

  async getUserAssignments(projectId) {
    try {
      return await this.makeRequest('get', `/projects/${projectId}/user_assignments`);
    } catch (error) {
      console.error('Harvest get user assignments error:', error);
      throw error;
    }
  }

  async createEstimate(estimateData) {
    try {
      const data = {
        client_id: estimateData.clientId,
        subject: estimateData.subject,
        currency: estimateData.currency || 'USD',
        line_items: estimateData.lineItems.map(item => ({
          kind: item.kind,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unitPrice
        }))
      };

      return await this.makeRequest('post', '/estimates', data);
    } catch (error) {
      console.error('Harvest create estimate error:', error);
      throw error;
    }
  }

  async test(config) {
    try {
      this.initialize(config);
      await this.getCompany();
      return true;
    } catch (error) {
      console.error('Harvest test connection error:', error);
      throw error;
    }
  }
}

module.exports = new HarvestService();

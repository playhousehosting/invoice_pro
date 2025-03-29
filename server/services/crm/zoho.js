const axios = require('axios');

class ZohoCRMService {
  constructor() {
    this.baseURL = process.env.ZOHO_API_URL || 'https://www.zohoapis.com/crm/v3';
    this.accessToken = null;
  }

  async authenticate() {
    try {
      const response = await axios.post(
        'https://accounts.zoho.com/oauth/v2/token',
        null,
        {
          params: {
            refresh_token: process.env.ZOHO_REFRESH_TOKEN,
            client_id: process.env.ZOHO_CLIENT_ID,
            client_secret: process.env.ZOHO_CLIENT_SECRET,
            grant_type: 'refresh_token'
          }
        }
      );

      this.accessToken = response.data.access_token;
      return this.accessToken;
    } catch (error) {
      console.error('Zoho authentication error:', error);
      throw error;
    }
  }

  async makeRequest(method, endpoint, data = null) {
    try {
      if (!this.accessToken) {
        await this.authenticate();
      }

      const response = await axios({
        method,
        url: `${this.baseURL}/${endpoint}`,
        headers: {
          'Authorization': `Zoho-oauthtoken ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        data
      });

      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        await this.authenticate();
        return this.makeRequest(method, endpoint, data);
      }
      throw error;
    }
  }

  async createContact(contactData) {
    try {
      const data = {
        data: [
          {
            First_Name: contactData.firstName,
            Last_Name: contactData.lastName,
            Email: contactData.email,
            Phone: contactData.phone,
            Account_Name: contactData.company,
            Mailing_Street: contactData.address?.street,
            Mailing_City: contactData.address?.city,
            Mailing_State: contactData.address?.state,
            Mailing_Zip: contactData.address?.postalCode,
            Mailing_Country: contactData.address?.country
          }
        ]
      };

      const response = await this.makeRequest('post', 'Contacts', data);
      return response.data[0];
    } catch (error) {
      console.error('Zoho create contact error:', error);
      throw error;
    }
  }

  async createAccount(accountData) {
    try {
      const data = {
        data: [
          {
            Account_Name: accountData.name,
            Phone: accountData.phone,
            Website: accountData.website,
            Billing_Street: accountData.billingAddress?.street,
            Billing_City: accountData.billingAddress?.city,
            Billing_State: accountData.billingAddress?.state,
            Billing_Code: accountData.billingAddress?.postalCode,
            Billing_Country: accountData.billingAddress?.country,
            Industry: accountData.industry,
            Description: accountData.description
          }
        ]
      };

      const response = await this.makeRequest('post', 'Accounts', data);
      return response.data[0];
    } catch (error) {
      console.error('Zoho create account error:', error);
      throw error;
    }
  }

  async createDeal(dealData) {
    try {
      const data = {
        data: [
          {
            Deal_Name: dealData.name,
            Account_Name: dealData.accountName,
            Amount: dealData.amount,
            Closing_Date: dealData.closeDate,
            Stage: dealData.stage,
            Description: dealData.description
          }
        ]
      };

      const response = await this.makeRequest('post', 'Deals', data);
      return response.data[0];
    } catch (error) {
      console.error('Zoho create deal error:', error);
      throw error;
    }
  }

  async syncInvoice(invoice) {
    try {
      // Create invoice record
      const invoiceData = {
        data: [
          {
            Subject: `Invoice #${invoice.number}`,
            Invoice_Number: invoice.number,
            Account_Name: invoice.accountName,
            Due_Date: invoice.dueDate,
            Status: invoice.status,
            Sub_Total: invoice.subtotal,
            Tax: invoice.tax,
            Grand_Total: invoice.total,
            Description: invoice.description
          }
        ]
      };

      const invoiceResponse = await this.makeRequest('post', 'Invoices', invoiceData);
      const invoiceId = invoiceResponse.data[0].id;

      // Create invoice line items
      const lineItemsData = {
        data: invoice.items.map(item => ({
          Product_Name: item.name,
          Quantity: item.quantity,
          List_Price: item.rate,
          Total: item.amount,
          Description: item.description,
          Parent_Id: invoiceId
        }))
      };

      const lineItemsResponse = await this.makeRequest('post', 'Invoice_Line_Items', lineItemsData);

      return {
        invoice: invoiceResponse.data[0],
        lineItems: lineItemsResponse.data
      };
    } catch (error) {
      console.error('Zoho sync invoice error:', error);
      throw error;
    }
  }

  async updateInvoiceStatus(invoiceId, status) {
    try {
      const data = {
        data: [
          {
            id: invoiceId,
            Status: status
          }
        ]
      };

      const response = await this.makeRequest('put', 'Invoices', data);
      return response.data[0];
    } catch (error) {
      console.error('Zoho update invoice status error:', error);
      throw error;
    }
  }

  async searchRecords(module, criteria) {
    try {
      const response = await this.makeRequest(
        'get',
        `${module}/search`,
        null,
        {
          params: {
            criteria: criteria
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Zoho search records error:', error);
      throw error;
    }
  }

  async createNote(noteData) {
    try {
      const data = {
        data: [
          {
            Note_Title: noteData.title,
            Note_Content: noteData.content,
            Parent_Id: noteData.parentId,
            se_module: noteData.parentModule
          }
        ]
      };

      const response = await this.makeRequest('post', 'Notes', data);
      return response.data[0];
    } catch (error) {
      console.error('Zoho create note error:', error);
      throw error;
    }
  }

  async createTask(taskData) {
    try {
      const data = {
        data: [
          {
            Subject: taskData.subject,
            Due_Date: taskData.dueDate,
            Status: taskData.status,
            Priority: taskData.priority,
            Description: taskData.description,
            What_Id: taskData.relatedToId,
            Who_Id: taskData.contactId
          }
        ]
      };

      const response = await this.makeRequest('post', 'Tasks', data);
      return response.data[0];
    } catch (error) {
      console.error('Zoho create task error:', error);
      throw error;
    }
  }

  async getCustomViews(module) {
    try {
      const response = await this.makeRequest('get', `${module}/views`);
      return response.data;
    } catch (error) {
      console.error('Zoho get custom views error:', error);
      throw error;
    }
  }

  async createCustomModule(moduleData) {
    try {
      const data = {
        modules: [
          {
            singular_label: moduleData.singularLabel,
            plural_label: moduleData.pluralLabel,
            api_name: moduleData.apiName,
            fields: moduleData.fields.map(field => ({
              field_label: field.label,
              api_name: field.apiName,
              data_type: field.dataType,
              length: field.length,
              decimal_place: field.decimalPlace,
              required: field.required
            }))
          }
        ]
      };

      const response = await this.makeRequest('post', 'settings/modules', data);
      return response.data;
    } catch (error) {
      console.error('Zoho create custom module error:', error);
      throw error;
    }
  }
}

module.exports = new ZohoCRMService();

const hubspot = require('@hubspot/api-client');

class HubSpotService {
  constructor() {
    this.hubspotClient = new hubspot.Client({
      accessToken: process.env.HUBSPOT_ACCESS_TOKEN
    });
  }

  async createContact(contactData) {
    try {
      const properties = {
        email: contactData.email,
        firstname: contactData.firstName,
        lastname: contactData.lastName,
        phone: contactData.phone,
        company: contactData.company,
        website: contactData.website,
        address: contactData.address?.street,
        city: contactData.address?.city,
        state: contactData.address?.state,
        zip: contactData.address?.postalCode,
        country: contactData.address?.country
      };

      const response = await this.hubspotClient.crm.contacts.basicApi.create({
        properties
      });

      return response;
    } catch (error) {
      console.error('HubSpot create contact error:', error);
      throw error;
    }
  }

  async createCompany(companyData) {
    try {
      const properties = {
        name: companyData.name,
        domain: companyData.website,
        phone: companyData.phone,
        address: companyData.address?.street,
        city: companyData.address?.city,
        state: companyData.address?.state,
        zip: companyData.address?.postalCode,
        country: companyData.address?.country,
        industry: companyData.industry,
        description: companyData.description
      };

      const response = await this.hubspotClient.crm.companies.basicApi.create({
        properties
      });

      return response;
    } catch (error) {
      console.error('HubSpot create company error:', error);
      throw error;
    }
  }

  async createDeal(dealData) {
    try {
      const properties = {
        dealname: dealData.name,
        amount: dealData.amount,
        dealstage: dealData.stage,
        pipeline: dealData.pipeline,
        closedate: dealData.closeDate,
        description: dealData.description
      };

      const response = await this.hubspotClient.crm.deals.basicApi.create({
        properties
      });

      return response;
    } catch (error) {
      console.error('HubSpot create deal error:', error);
      throw error;
    }
  }

  async syncInvoice(invoice) {
    try {
      // Create custom object for invoice
      const invoiceProperties = {
        invoice_number: invoice.number,
        amount: invoice.total.toString(),
        due_date: invoice.dueDate,
        status: invoice.status,
        description: invoice.description
      };

      // Create invoice record
      const invoiceRecord = await this.hubspotClient.crm.objects.basicApi.create(
        'invoice',
        { properties: invoiceProperties }
      );

      // Create line items
      const lineItems = await Promise.all(
        invoice.items.map(item =>
          this.hubspotClient.crm.objects.basicApi.create('invoice_line_item', {
            properties: {
              invoice_id: invoiceRecord.id,
              product_name: item.name,
              description: item.description,
              quantity: item.quantity.toString(),
              unit_price: item.rate.toString(),
              total_amount: item.amount.toString()
            }
          })
        )
      );

      return {
        invoice: invoiceRecord,
        lineItems
      };
    } catch (error) {
      console.error('HubSpot sync invoice error:', error);
      throw error;
    }
  }

  async updateInvoiceStatus(invoiceId, status) {
    try {
      const response = await this.hubspotClient.crm.objects.basicApi.update(
        'invoice',
        invoiceId,
        {
          properties: {
            status: status
          }
        }
      );

      return response;
    } catch (error) {
      console.error('HubSpot update invoice status error:', error);
      throw error;
    }
  }

  async searchContacts(query) {
    try {
      const filter = {
        filterGroups: [
          {
            filters: [
              {
                propertyName: 'email',
                operator: 'CONTAINS_TOKEN',
                value: query
              }
            ]
          }
        ]
      };

      const response = await this.hubspotClient.crm.contacts.searchApi.doSearch({
        ...filter,
        sorts: ['lastname'],
        properties: ['email', 'firstname', 'lastname', 'phone', 'company']
      });

      return response.results;
    } catch (error) {
      console.error('HubSpot search contacts error:', error);
      throw error;
    }
  }

  async searchCompanies(query) {
    try {
      const filter = {
        filterGroups: [
          {
            filters: [
              {
                propertyName: 'name',
                operator: 'CONTAINS_TOKEN',
                value: query
              }
            ]
          }
        ]
      };

      const response = await this.hubspotClient.crm.companies.searchApi.doSearch({
        ...filter,
        sorts: ['name'],
        properties: ['name', 'domain', 'phone', 'address', 'industry']
      });

      return response.results;
    } catch (error) {
      console.error('HubSpot search companies error:', error);
      throw error;
    }
  }

  async createNote(noteData) {
    try {
      const properties = {
        hs_note_body: noteData.body,
        hs_timestamp: Date.now()
      };

      const associations = [
        {
          to: {
            id: noteData.associatedObjectId
          },
          types: [
            {
              associationCategory: 'HUBSPOT_DEFINED',
              associationTypeId: noteData.associationTypeId
            }
          ]
        }
      ];

      const response = await this.hubspotClient.crm.objects.notes.basicApi.create({
        properties,
        associations
      });

      return response;
    } catch (error) {
      console.error('HubSpot create note error:', error);
      throw error;
    }
  }

  async createTask(taskData) {
    try {
      const properties = {
        hs_task_body: taskData.body,
        hs_task_priority: taskData.priority,
        hs_task_status: taskData.status,
        hs_task_subject: taskData.subject,
        hs_timestamp: Date.now(),
        hs_task_type: taskData.type
      };

      const response = await this.hubspotClient.crm.objects.tasks.basicApi.create({
        properties
      });

      return response;
    } catch (error) {
      console.error('HubSpot create task error:', error);
      throw error;
    }
  }

  async getDeals(companyId) {
    try {
      const associations = [
        {
          fromObjectType: 'companies',
          toObjectType: 'deals'
        }
      ];

      const response = await this.hubspotClient.crm.companies.associationsApi.getAll(
        companyId,
        'deals'
      );

      const dealIds = response.results.map(result => result.id);
      const deals = await Promise.all(
        dealIds.map(id =>
          this.hubspotClient.crm.deals.basicApi.getById(id, [
            'dealname',
            'amount',
            'dealstage',
            'closedate'
          ])
        )
      );

      return deals;
    } catch (error) {
      console.error('HubSpot get deals error:', error);
      throw error;
    }
  }

  async createCustomObject(objectName, properties) {
    try {
      const schema = {
        name: objectName,
        primaryDisplayProperty: 'name',
        properties: properties.map(prop => ({
          name: prop.name,
          label: prop.label,
          type: prop.type,
          fieldType: prop.fieldType
        }))
      };

      const response = await this.hubspotClient.crm.schemas.coreApi.create(schema);
      return response;
    } catch (error) {
      console.error('HubSpot create custom object error:', error);
      throw error;
    }
  }
}

module.exports = new HubSpotService();

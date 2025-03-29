const axios = require('axios');

class PayPalService {
  constructor() {
    this.baseURL = process.env.NODE_ENV === 'production'
      ? 'https://api.paypal.com'
      : 'https://api.sandbox.paypal.com';
    this.clientId = process.env.PAYPAL_CLIENT_ID;
    this.clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  }

  async getAccessToken() {
    try {
      const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
      const response = await axios({
        method: 'post',
        url: `${this.baseURL}/v1/oauth2/token`,
        headers: {
          'Accept': 'application/json',
          'Accept-Language': 'en_US',
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        data: 'grant_type=client_credentials'
      });

      return response.data.access_token;
    } catch (error) {
      console.error('PayPal get access token error:', error);
      throw error;
    }
  }

  async createOrder(items, currency = 'USD') {
    try {
      const accessToken = await this.getAccessToken();
      const total = items.reduce((sum, item) => 
        sum + (item.amount * (item.quantity || 1)), 0
      ).toFixed(2);

      const response = await axios({
        method: 'post',
        url: `${this.baseURL}/v2/checkout/orders`,
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        data: {
          intent: 'CAPTURE',
          purchase_units: [{
            amount: {
              currency_code: currency,
              value: total,
              breakdown: {
                item_total: {
                  currency_code: currency,
                  value: total
                }
              }
            },
            items: items.map(item => ({
              name: item.name,
              description: item.description,
              quantity: item.quantity || '1',
              unit_amount: {
                currency_code: currency,
                value: item.amount.toFixed(2)
              }
            }))
          }]
        }
      });

      return response.data;
    } catch (error) {
      console.error('PayPal create order error:', error);
      throw error;
    }
  }

  async capturePayment(orderId) {
    try {
      const accessToken = await this.getAccessToken();
      const response = await axios({
        method: 'post',
        url: `${this.baseURL}/v2/checkout/orders/${orderId}/capture`,
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      console.error('PayPal capture payment error:', error);
      throw error;
    }
  }

  async createInvoice(invoice) {
    try {
      const accessToken = await this.getAccessToken();
      const response = await axios({
        method: 'post',
        url: `${this.baseURL}/v2/invoicing/invoices`,
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        data: {
          detail: {
            invoice_number: invoice.number,
            reference: invoice.reference,
            invoice_date: new Date().toISOString().split('T')[0],
            currency_code: invoice.currency || 'USD',
            payment_term: {
              term_type: 'NET_30'
            }
          },
          invoicer: {
            name: {
              given_name: invoice.from.name
            },
            email_address: invoice.from.email,
            address: {
              address_line_1: invoice.from.address
            }
          },
          primary_recipients: [{
            billing_info: {
              name: {
                given_name: invoice.to.name
              },
              email_address: invoice.to.email,
              address: {
                address_line_1: invoice.to.address
              }
            }
          }],
          items: invoice.items.map(item => ({
            name: item.name,
            description: item.description,
            quantity: item.quantity.toString(),
            unit_amount: {
              currency_code: invoice.currency || 'USD',
              value: item.amount.toFixed(2)
            }
          }))
        }
      });

      return response.data;
    } catch (error) {
      console.error('PayPal create invoice error:', error);
      throw error;
    }
  }

  async getInvoiceDetails(invoiceId) {
    try {
      const accessToken = await this.getAccessToken();
      const response = await axios({
        method: 'get',
        url: `${this.baseURL}/v2/invoicing/invoices/${invoiceId}`,
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      console.error('PayPal get invoice details error:', error);
      throw error;
    }
  }

  async sendInvoice(invoiceId) {
    try {
      const accessToken = await this.getAccessToken();
      const response = await axios({
        method: 'post',
        url: `${this.baseURL}/v2/invoicing/invoices/${invoiceId}/send`,
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      console.error('PayPal send invoice error:', error);
      throw error;
    }
  }

  async refundPayment(captureId, amount = null) {
    try {
      const accessToken = await this.getAccessToken();
      const data = amount ? {
        amount: {
          value: amount.toFixed(2),
          currency_code: 'USD'
        }
      } : {};

      const response = await axios({
        method: 'post',
        url: `${this.baseURL}/v2/payments/captures/${captureId}/refund`,
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        data
      });

      return response.data;
    } catch (error) {
      console.error('PayPal refund error:', error);
      throw error;
    }
  }

  async createSubscription(planId) {
    try {
      const accessToken = await this.getAccessToken();
      const response = await axios({
        method: 'post',
        url: `${this.baseURL}/v1/billing/subscriptions`,
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        data: {
          plan_id: planId,
          application_context: {
            return_url: `${process.env.APP_URL}/subscription/success`,
            cancel_url: `${process.env.APP_URL}/subscription/cancel`
          }
        }
      });

      return response.data;
    } catch (error) {
      console.error('PayPal create subscription error:', error);
      throw error;
    }
  }
}

module.exports = new PayPalService();

const twilio = require('twilio');

class SMSService {
  constructor() {
    this.client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    this.fromNumber = process.env.TWILIO_PHONE_NUMBER;
  }

  async sendMessage(to, message) {
    try {
      const response = await this.client.messages.create({
        body: message,
        from: this.fromNumber,
        to
      });
      return response;
    } catch (error) {
      console.error('SMS service error:', error);
      throw error;
    }
  }

  async sendInvoiceNotification(to, invoice) {
    const message = `New invoice #${invoice.number} for $${invoice.total} has been created. Due date: ${invoice.dueDate}`;
    return this.sendMessage(to, message);
  }

  async sendPaymentReminder(to, invoice) {
    const message = `Reminder: Invoice #${invoice.number} for $${invoice.total} is due on ${invoice.dueDate}. Please ensure timely payment.`;
    return this.sendMessage(to, message);
  }

  async sendPaymentConfirmation(to, payment) {
    const message = `Payment received: $${payment.amount} for invoice #${payment.invoiceNumber}. Thank you for your business!`;
    return this.sendMessage(to, message);
  }

  async sendLatePaymentReminder(to, invoice) {
    const message = `OVERDUE: Invoice #${invoice.number} for $${invoice.total} was due on ${invoice.dueDate}. Please make payment as soon as possible.`;
    return this.sendMessage(to, message);
  }

  async sendBulkMessages(recipients, message) {
    try {
      const promises = recipients.map(recipient => 
        this.sendMessage(recipient, message)
      );
      return Promise.all(promises);
    } catch (error) {
      console.error('Bulk SMS service error:', error);
      throw error;
    }
  }

  async scheduleMessage(to, message, sendAt) {
    try {
      // Convert sendAt to UTC if it's not already
      const scheduledTime = new Date(sendAt).toISOString();

      // Using Twilio's messaging service with scheduled messages
      const response = await this.client.messages.create({
        body: message,
        from: this.fromNumber,
        to,
        scheduleType: 'fixed',
        sendAt: scheduledTime
      });

      return response;
    } catch (error) {
      console.error('Schedule SMS service error:', error);
      throw error;
    }
  }

  async cancelScheduledMessage(messageId) {
    try {
      const response = await this.client.messages(messageId).update({
        status: 'canceled'
      });
      return response;
    } catch (error) {
      console.error('Cancel scheduled SMS error:', error);
      throw error;
    }
  }

  async getMessageStatus(messageId) {
    try {
      const message = await this.client.messages(messageId).fetch();
      return message.status;
    } catch (error) {
      console.error('Get SMS status error:', error);
      throw error;
    }
  }

  formatPhoneNumber(phoneNumber) {
    // Remove all non-numeric characters
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    // Ensure number starts with country code
    if (!cleaned.startsWith('1')) {
      return `+1${cleaned}`;
    }
    
    return `+${cleaned}`;
  }
}

module.exports = new SMSService();

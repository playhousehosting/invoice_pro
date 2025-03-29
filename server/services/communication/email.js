const sgMail = require('@sendgrid/mail');
const formData = require('form-data');
const Mailgun = require('mailgun.js');

class EmailService {
  constructor() {
    // SendGrid setup
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    // Mailgun setup
    const mailgun = new Mailgun(formData);
    this.mg = mailgun.client({
      username: 'api',
      key: process.env.MAILGUN_API_KEY
    });
    this.mailgunDomain = process.env.MAILGUN_DOMAIN;

    // Default provider
    this.defaultProvider = 'sendgrid';
  }

  async sendInvoice(to, invoice, provider = this.defaultProvider) {
    const emailData = {
      to,
      from: process.env.FROM_EMAIL,
      subject: `Invoice #${invoice.number} from ${invoice.from.name}`,
      text: `Please find attached invoice #${invoice.number} for ${invoice.total}`,
      html: this.generateInvoiceHtml(invoice),
      attachments: [{
        content: Buffer.from(invoice.pdf).toString('base64'),
        filename: `invoice-${invoice.number}.pdf`,
        type: 'application/pdf',
        disposition: 'attachment'
      }]
    };

    try {
      if (provider === 'sendgrid') {
        await sgMail.send(emailData);
      } else if (provider === 'mailgun') {
        await this.mg.messages.create(this.mailgunDomain, {
          ...emailData,
          attachment: [{
            data: Buffer.from(invoice.pdf),
            filename: `invoice-${invoice.number}.pdf`
          }]
        });
      }

      return { success: true };
    } catch (error) {
      console.error('Email service error:', error);
      throw error;
    }
  }

  async sendPaymentReminder(to, invoice, provider = this.defaultProvider) {
    const emailData = {
      to,
      from: process.env.FROM_EMAIL,
      subject: `Payment Reminder: Invoice #${invoice.number}`,
      text: `This is a friendly reminder that invoice #${invoice.number} for ${invoice.total} is due on ${invoice.dueDate}`,
      html: this.generateReminderHtml(invoice)
    };

    try {
      if (provider === 'sendgrid') {
        await sgMail.send(emailData);
      } else if (provider === 'mailgun') {
        await this.mg.messages.create(this.mailgunDomain, emailData);
      }

      return { success: true };
    } catch (error) {
      console.error('Email service error:', error);
      throw error;
    }
  }

  async sendPaymentConfirmation(to, payment, provider = this.defaultProvider) {
    const emailData = {
      to,
      from: process.env.FROM_EMAIL,
      subject: `Payment Confirmation for Invoice #${payment.invoiceNumber}`,
      text: `Thank you for your payment of ${payment.amount} for invoice #${payment.invoiceNumber}`,
      html: this.generatePaymentConfirmationHtml(payment)
    };

    try {
      if (provider === 'sendgrid') {
        await sgMail.send(emailData);
      } else if (provider === 'mailgun') {
        await this.mg.messages.create(this.mailgunDomain, emailData);
      }

      return { success: true };
    } catch (error) {
      console.error('Email service error:', error);
      throw error;
    }
  }

  generateInvoiceHtml(invoice) {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
        <h1>Invoice #${invoice.number}</h1>
        <div style="margin-bottom: 20px;">
          <strong>From:</strong><br>
          ${invoice.from.name}<br>
          ${invoice.from.address}<br>
          ${invoice.from.email}
        </div>
        <div style="margin-bottom: 20px;">
          <strong>To:</strong><br>
          ${invoice.to.name}<br>
          ${invoice.to.address}<br>
          ${invoice.to.email}
        </div>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead>
            <tr style="background-color: #f8f9fa;">
              <th style="padding: 10px; border: 1px solid #dee2e6;">Description</th>
              <th style="padding: 10px; border: 1px solid #dee2e6;">Quantity</th>
              <th style="padding: 10px; border: 1px solid #dee2e6;">Rate</th>
              <th style="padding: 10px; border: 1px solid #dee2e6;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${invoice.items.map(item => `
              <tr>
                <td style="padding: 10px; border: 1px solid #dee2e6;">${item.description}</td>
                <td style="padding: 10px; border: 1px solid #dee2e6;">${item.quantity}</td>
                <td style="padding: 10px; border: 1px solid #dee2e6;">$${item.rate}</td>
                <td style="padding: 10px; border: 1px solid #dee2e6;">$${item.amount}</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="3" style="padding: 10px; border: 1px solid #dee2e6; text-align: right;"><strong>Total:</strong></td>
              <td style="padding: 10px; border: 1px solid #dee2e6;"><strong>$${invoice.total}</strong></td>
            </tr>
          </tfoot>
        </table>
        <div style="margin-bottom: 20px;">
          <strong>Due Date:</strong> ${invoice.dueDate}
        </div>
        <div style="margin-bottom: 20px;">
          <strong>Payment Instructions:</strong><br>
          ${invoice.paymentInstructions}
        </div>
      </div>
    `;
  }

  generateReminderHtml(invoice) {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
        <h1>Payment Reminder</h1>
        <p>This is a friendly reminder that invoice #${invoice.number} for $${invoice.total} is due on ${invoice.dueDate}.</p>
        <p>Please ensure payment is made before the due date to avoid any late fees.</p>
        <div style="margin: 20px 0;">
          <strong>Invoice Details:</strong>
          <ul>
            <li>Invoice Number: ${invoice.number}</li>
            <li>Amount Due: $${invoice.total}</li>
            <li>Due Date: ${invoice.dueDate}</li>
          </ul>
        </div>
        <div style="margin-bottom: 20px;">
          <strong>Payment Instructions:</strong><br>
          ${invoice.paymentInstructions}
        </div>
      </div>
    `;
  }

  generatePaymentConfirmationHtml(payment) {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
        <h1>Payment Confirmation</h1>
        <p>Thank you for your payment. This email confirms that we have received your payment for invoice #${payment.invoiceNumber}.</p>
        <div style="margin: 20px 0;">
          <strong>Payment Details:</strong>
          <ul>
            <li>Invoice Number: ${payment.invoiceNumber}</li>
            <li>Amount Paid: $${payment.amount}</li>
            <li>Payment Date: ${payment.date}</li>
            <li>Payment Method: ${payment.method}</li>
            <li>Transaction ID: ${payment.transactionId}</li>
          </ul>
        </div>
      </div>
    `;
  }
}

module.exports = new EmailService();

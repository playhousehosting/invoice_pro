const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');
const bwipjs = require('bwip-js');

class PDFGeneratorService {
  constructor() {
    this.defaultStyles = {
      font: 'Helvetica',
      fontSize: 12,
      lineHeight: 1.2,
      color: '#000000'
    };
  }

  async generateInvoicePDF(invoice) {
    return new Promise(async (resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const chunks = [];

        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Add company logo if available
        if (invoice.companyLogo) {
          doc.image(invoice.companyLogo, 50, 50, { width: 150 });
          doc.moveDown(2);
        }

        // Header
        this.addHeader(doc, invoice);
        doc.moveDown();

        // Bill To & Ship To
        this.addBillingAndShippingInfo(doc, invoice);
        doc.moveDown();

        // Invoice Details
        this.addInvoiceDetails(doc, invoice);
        doc.moveDown();

        // Items Table
        await this.addItemsTable(doc, invoice);
        doc.moveDown();

        // Totals
        this.addTotals(doc, invoice);
        doc.moveDown();

        // Notes & Terms
        this.addNotesAndTerms(doc, invoice);
        doc.moveDown();

        // Payment Instructions
        this.addPaymentInstructions(doc, invoice);
        doc.moveDown();

        // QR Code for digital payment
        if (invoice.paymentQRCode) {
          await this.addPaymentQRCode(doc, invoice);
        }

        // Footer
        this.addFooter(doc, invoice);

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  addHeader(doc, invoice) {
    doc.fontSize(24)
       .font('Helvetica-Bold')
       .text('INVOICE', { align: 'right' });

    doc.fontSize(12)
       .font('Helvetica')
       .text(`Invoice Number: ${invoice.number}`, { align: 'right' })
       .text(`Date: ${invoice.date}`, { align: 'right' })
       .text(`Due Date: ${invoice.dueDate}`, { align: 'right' });
  }

  addBillingAndShippingInfo(doc, invoice) {
    const startY = doc.y;

    // From (Company Info)
    doc.font('Helvetica-Bold')
       .text('From:', { continued: true })
       .font('Helvetica')
       .text(invoice.from.name)
       .text(invoice.from.address)
       .text(invoice.from.email)
       .text(invoice.from.phone || '');

    // To (Client Info)
    doc.font('Helvetica-Bold')
       .text('Bill To:', 350, startY, { continued: true })
       .font('Helvetica')
       .text(invoice.to.name)
       .text(invoice.to.address)
       .text(invoice.to.email)
       .text(invoice.to.phone || '');
  }

  addInvoiceDetails(doc, invoice) {
    doc.font('Helvetica')
       .fontSize(10)
       .text(`Reference: ${invoice.reference || 'N/A'}`)
       .text(`Purchase Order: ${invoice.purchaseOrder || 'N/A'}`)
       .text(`Project: ${invoice.project || 'N/A'}`);
  }

  async addItemsTable(doc, invoice) {
    const tableTop = doc.y + 20;
    const itemCodeX = 50;
    const descriptionX = 100;
    const quantityX = 300;
    const rateX = 400;
    const amountX = 500;

    // Table headers
    doc.font('Helvetica-Bold')
       .text('Code', itemCodeX, tableTop)
       .text('Description', descriptionX, tableTop)
       .text('Quantity', quantityX, tableTop)
       .text('Rate', rateX, tableTop)
       .text('Amount', amountX, tableTop);

    // Draw header line
    doc.moveTo(50, tableTop + 15)
       .lineTo(550, tableTop + 15)
       .stroke();

    let currentY = tableTop + 30;

    // Table rows
    doc.font('Helvetica');
    invoice.items.forEach(item => {
      doc.text(item.code || '', itemCodeX, currentY)
         .text(item.description, descriptionX, currentY)
         .text(item.quantity.toString(), quantityX, currentY)
         .text(this.formatCurrency(item.rate), rateX, currentY)
         .text(this.formatCurrency(item.amount), amountX, currentY);

      currentY += 20;
    });

    // Draw bottom line
    doc.moveTo(50, currentY + 5)
       .lineTo(550, currentY + 5)
       .stroke();

    doc.y = currentY + 20;
  }

  addTotals(doc, invoice) {
    const startX = 400;
    const valueX = 500;

    doc.font('Helvetica')
       .text('Subtotal:', startX)
       .text(this.formatCurrency(invoice.subtotal), valueX)
       .text('Tax:', startX)
       .text(this.formatCurrency(invoice.tax), valueX)
       .text('Discount:', startX)
       .text(this.formatCurrency(invoice.discount || 0), valueX);

    doc.font('Helvetica-Bold')
       .text('Total:', startX)
       .text(this.formatCurrency(invoice.total), valueX);

    if (invoice.amountPaid) {
      doc.font('Helvetica')
         .text('Amount Paid:', startX)
         .text(this.formatCurrency(invoice.amountPaid), valueX)
         .font('Helvetica-Bold')
         .text('Balance Due:', startX)
         .text(this.formatCurrency(invoice.total - invoice.amountPaid), valueX);
    }
  }

  addNotesAndTerms(doc, invoice) {
    if (invoice.notes) {
      doc.font('Helvetica-Bold')
         .text('Notes:')
         .font('Helvetica')
         .text(invoice.notes);
    }

    if (invoice.terms) {
      doc.moveDown()
         .font('Helvetica-Bold')
         .text('Terms and Conditions:')
         .font('Helvetica')
         .text(invoice.terms);
    }
  }

  addPaymentInstructions(doc, invoice) {
    if (invoice.paymentInstructions) {
      doc.moveDown()
         .font('Helvetica-Bold')
         .text('Payment Instructions:')
         .font('Helvetica')
         .text(invoice.paymentInstructions);
    }
  }

  async addPaymentQRCode(doc, invoice) {
    try {
      // Generate QR code
      const qrCodeData = await QRCode.toDataURL(invoice.paymentQRCode);
      
      // Add QR code to document
      doc.image(qrCodeData, {
        fit: [100, 100],
        align: 'right',
        valign: 'center'
      });

      doc.moveDown()
         .fontSize(10)
         .text('Scan to pay', { align: 'right' });
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  }

  addFooter(doc, invoice) {
    const footerTop = doc.page.height - 100;

    doc.fontSize(8)
       .text(invoice.footer || 'Thank you for your business!', 50, footerTop, {
         align: 'center',
         width: doc.page.width - 100
       });

    // Add page numbers
    const pages = doc.bufferedPageRange();
    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(i);
      doc.fontSize(8)
         .text(
           `Page ${i + 1} of ${pages.count}`,
           50,
           doc.page.height - 50,
           { align: 'center', width: doc.page.width - 100 }
         );
    }
  }

  async generateBarcode(data, options = {}) {
    try {
      const defaultOptions = {
        bcid: 'code128',
        text: data,
        scale: 3,
        height: 10,
        includetext: true,
        textxalign: 'center'
      };

      const buffer = await bwipjs.toBuffer({
        ...defaultOptions,
        ...options
      });

      return buffer;
    } catch (error) {
      console.error('Barcode generation error:', error);
      throw error;
    }
  }

  formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }
}

module.exports = new PDFGeneratorService();

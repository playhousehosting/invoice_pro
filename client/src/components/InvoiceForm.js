import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import ContactSelectionModal from './ContactSelectionModal';
import LogoUpload from './LogoUpload';
import api, { getAssetUrl } from '../utils/api';

function InvoiceForm() {
  const [client, setClient] = useState('');
  const [companyInfo, setCompanyInfo] = useState({
    name: 'Your IT Consulting',
    address: '123 Tech Lane, Silicon Valley, CA',
    email: 'contact@yourcompany.com',
    phone: '(555) 123-4567'
  });
  const [items, setItems] = useState([
    { description: '', quantity: 1, price: 0 }
  ]);
  const [total, setTotal] = useState(0);
  const [message, setMessage] = useState('');
  const [showContactModal, setShowContactModal] = useState(false);
  const [logoPath, setLogoPath] = useState('');

  const calculateTotal = () => {
    const totalAmount = items.reduce((acc, item) => acc + (item.quantity * item.price), 0);
    setTotal(totalAmount);
    return totalAmount;
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = (field === 'quantity' || field === 'price') ? parseFloat(value) || 0 : value;
    setItems(newItems);
    calculateTotal();
  };

  const addItem = () => {
    setItems([...items, { description: '', quantity: 1, price: 0 }]);
  };

  const removeItem = (index) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
    calculateTotal();
  };

  const handleSaveInvoice = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setMessage('Please login or register to save invoices.');
      return;
    }
    try {
      const invoiceData = { client, companyInfo, items, total: calculateTotal() };
      await api.post('/api/invoice', invoiceData);
      setMessage('Invoice saved successfully!');
    } catch (error) {
      console.error('Error saving invoice:', error);
      setMessage('Error saving invoice. Please try again.');
    }
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    
    let startY = 20;
    
    // Add company logo if available
    if (logoPath) {
      try {
        // Add logo to PDF (adjust positioning as needed)
        const logoUrl = getAssetUrl(logoPath);
        
        // Create an image element to get dimensions
        const img = new Image();
        img.src = logoUrl;
        
        // Add logo asynchronously when image loads
        img.onload = function() {
          // Calculate dimensions to maintain aspect ratio but limit size
          const maxWidth = 60;
          const maxHeight = 40;
          
          let imgWidth = img.width;
          let imgHeight = img.height;
          
          if (imgWidth > maxWidth) {
            const ratio = maxWidth / imgWidth;
            imgWidth = maxWidth;
            imgHeight = imgHeight * ratio;
          }
          
          if (imgHeight > maxHeight) {
            const ratio = maxHeight / imgHeight;
            imgHeight = maxHeight;
            imgWidth = imgWidth * ratio;
          }
          
          // Add image to PDF
          doc.addImage(logoUrl, 'PNG', 14, 14, imgWidth, imgHeight);
          
          // Continue with the rest of the PDF generation
          continueGeneratingPDF();
        };
        
        // In case image fails to load
        img.onerror = function() {
          console.error('Error loading logo image');
          continueGeneratingPDF();
        };
      } catch (error) {
        console.error('Error with logo in PDF:', error);
        continueGeneratingPDF();
      }
    } else {
      continueGeneratingPDF();
    }
    
    function continueGeneratingPDF() {
      // Company info
      doc.setFontSize(18);
      doc.text(companyInfo.name, 14, startY + 35);
      
      doc.setFontSize(10);
      doc.text(companyInfo.address, 14, startY + 45);
      doc.text(`Email: ${companyInfo.email}`, 14, startY + 50);
      doc.text(`Phone: ${companyInfo.phone}`, 14, startY + 55);
      
      // Invoice title
      doc.setFontSize(22);
      doc.text('INVOICE', 140, startY + 20);
      
      // Date
      const today = new Date();
      doc.setFontSize(10);
      doc.text(`Date: ${today.toLocaleDateString()}`, 140, startY + 30);
      
      // Client info
      doc.setFontSize(12);
      doc.text('Bill To:', 14, startY + 70);
      doc.setFontSize(10);
      doc.text(client, 14, startY + 80);
      
      // Items table
      startY = startY + 100;
      
      // Table header
      doc.setFillColor(240, 240, 240);
      doc.rect(14, startY, 182, 10, 'F');
      doc.setFontSize(10);
      doc.text('Description', 16, startY + 7);
      doc.text('Quantity', 100, startY + 7);
      doc.text('Price', 130, startY + 7);
      doc.text('Amount', 170, startY + 7);
      
      startY += 15;
      
      // Table rows
      items.forEach((item, index) => {
        doc.text(item.description, 16, startY);
        doc.text(item.quantity.toString(), 100, startY);
        doc.text(`$${item.price.toFixed(2)}`, 130, startY);
        doc.text(`$${(item.quantity * item.price).toFixed(2)}`, 170, startY);
        startY += 10;
      });
      
      // Total
      startY += 10;
      doc.setFillColor(240, 240, 240);
      doc.rect(130, startY, 66, 10, 'F');
      doc.setFontSize(12);
      doc.text('Total:', 135, startY + 7);
      doc.text(`$${total.toFixed(2)}`, 170, startY + 7);
      
      // Footer
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.text('Thank you for your business!', 14, 280);
      }
      
      // Save the PDF
      doc.save(`Invoice-${today.toLocaleDateString().replace(/\//g, '-')}.pdf`);
    }
  };

  const handleLogoChange = (path) => {
    setLogoPath(path);
  };

  const handleSelectContact = (contact) => {
    setClient(contact.name);
    setShowContactModal(false);
  };

  return (
    <div className="container mt-4">
      <h1 className="mb-4">Create Invoice</h1>
      
      {message && (
        <div className={`alert ${message.includes('successfully') ? 'alert-success' : 'alert-danger'} mb-4`}>
          {message}
        </div>
      )}
      
      <div className="row">
        <div className="col-md-8">
          <div className="card shadow-sm mb-4">
            <div className="card-header bg-light">
              <h5 className="mb-0">Company Information</h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">Company Name</label>
                    <input
                      type="text"
                      className="form-control"
                      value={companyInfo.name}
                      onChange={(e) => setCompanyInfo({...companyInfo, name: e.target.value})}
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      className="form-control"
                      value={companyInfo.email}
                      onChange={(e) => setCompanyInfo({...companyInfo, email: e.target.value})}
                    />
                  </div>
                </div>
              </div>
              <div className="row">
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">Address</label>
                    <input
                      type="text"
                      className="form-control"
                      value={companyInfo.address}
                      onChange={(e) => setCompanyInfo({...companyInfo, address: e.target.value})}
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">Phone</label>
                    <input
                      type="text"
                      className="form-control"
                      value={companyInfo.phone}
                      onChange={(e) => setCompanyInfo({...companyInfo, phone: e.target.value})}
                    />
                  </div>
                </div>
              </div>
              <div className="row">
                <div className="col-12">
                  <LogoUpload onLogoChange={handleLogoChange} />
                </div>
              </div>
            </div>
          </div>
          
          <div className="card shadow-sm mb-4">
            <div className="card-header bg-light d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Client Information</h5>
              <button 
                className="btn btn-sm btn-outline-primary" 
                onClick={() => setShowContactModal(true)}
              >
                Select from Address Book
              </button>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <label className="form-label">Client Name / Company</label>
                <input
                  type="text"
                  className="form-control"
                  value={client}
                  onChange={(e) => setClient(e.target.value)}
                  placeholder="Enter client name or company"
                />
              </div>
            </div>
          </div>
          
          <div className="card shadow-sm mb-4">
            <div className="card-header bg-light">
              <h5 className="mb-0">Invoice Items</h5>
            </div>
            <div className="card-body">
              {items.map((item, index) => (
                <div key={index} className="row mb-3 align-items-end">
                  <div className="col-md-6">
                    <label className="form-label">Description</label>
                    <input
                      type="text"
                      className="form-control"
                      value={item.description}
                      onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                      placeholder="Item description"
                    />
                  </div>
                  <div className="col-md-2">
                    <label className="form-label">Quantity</label>
                    <input
                      type="number"
                      className="form-control"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                      min="1"
                    />
                  </div>
                  <div className="col-md-2">
                    <label className="form-label">Price</label>
                    <div className="input-group">
                      <span className="input-group-text">$</span>
                      <input
                        type="number"
                        className="form-control"
                        value={item.price}
                        onChange={(e) => handleItemChange(index, 'price', e.target.value)}
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>
                  <div className="col-md-2 d-flex align-items-center">
                    <button
                      type="button"
                      className="btn btn-outline-danger"
                      onClick={() => removeItem(index)}
                      disabled={items.length === 1}
                    >
                      <i className="bi bi-trash"></i>
                    </button>
                  </div>
                </div>
              ))}
              
              <button
                type="button"
                className="btn btn-outline-primary"
                onClick={addItem}
              >
                <i className="bi bi-plus-circle me-1"></i> Add Item
              </button>
            </div>
            <div className="card-footer bg-light">
              <div className="row">
                <div className="col-md-6 offset-md-6">
                  <div className="d-flex justify-content-between">
                    <h5>Total:</h5>
                    <h5>${total.toFixed(2)}</h5>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="d-flex justify-content-end mb-5">
            <button
              type="button"
              className="btn btn-outline-secondary me-2"
              onClick={handleExportPDF}
            >
              <i className="bi bi-file-pdf me-1"></i> Export as PDF
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSaveInvoice}
            >
              <i className="bi bi-save me-1"></i> Save Invoice
            </button>
          </div>
        </div>
        
        <div className="col-md-4">
          <div className="card shadow-sm">
            <div className="card-header bg-light">
              <h5 className="mb-0">Invoice Preview</h5>
            </div>
            <div className="card-body p-4">
              <div className="invoice-preview">
                {/* Company header */}
                <div className="mb-4">
                  <h4>{companyInfo.name}</h4>
                  <div className="small text-muted">
                    {companyInfo.address}<br />
                    {companyInfo.email}<br />
                    {companyInfo.phone}
                  </div>
                </div>
                
                {/* Invoice title */}
                <div className="text-center mb-4">
                  <h3 className="text-uppercase">Invoice</h3>
                  <div className="text-muted">
                    {new Date().toLocaleDateString()}
                  </div>
                </div>
                
                {/* Client info */}
                <div className="mb-4">
                  <strong>Bill To:</strong>
                  <div>{client || 'Client Name'}</div>
                </div>
                
                {/* Items table */}
                <table className="table table-sm">
                  <thead className="table-light">
                    <tr>
                      <th>Description</th>
                      <th className="text-end">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => (
                      <tr key={index}>
                        <td>
                          {item.description || 'Item description'}<br />
                          <small className="text-muted">
                            {item.quantity} x ${item.price.toFixed(2)}
                          </small>
                        </td>
                        <td className="text-end">${(item.quantity * item.price).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <th>Total</th>
                      <th className="text-end">${total.toFixed(2)}</th>
                    </tr>
                  </tfoot>
                </table>
                
                {/* Thank you note */}
                <div className="text-center text-muted small mt-4">
                  Thank you for your business!
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Contact selection modal */}
      {showContactModal && (
        <ContactSelectionModal
          onClose={() => setShowContactModal(false)}
          onSelectContact={handleSelectContact}
        />
      )}
    </div>
  );
}

export default InvoiceForm;

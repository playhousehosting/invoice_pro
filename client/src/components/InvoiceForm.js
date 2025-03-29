import React, { useState } from 'react';
import axios from 'axios';
import { jsPDF } from 'jspdf';
import ContactSelectionModal from './ContactSelectionModal';

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
      await axios.post('http://localhost:5000/api/invoice', invoiceData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage('Invoice saved successfully!');
    } catch (error) {
      setMessage('Error saving invoice.');
    }
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    
    // Add company header
    doc.setFontSize(20);
    doc.setTextColor(44, 62, 80);
    doc.text(companyInfo.name, 105, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.text(companyInfo.address, 105, 28, { align: 'center' });
    doc.text(`Email: ${companyInfo.email} | Phone: ${companyInfo.phone}`, 105, 34, { align: 'center' });
    
    // Add horizontal line
    doc.setDrawColor(44, 62, 80);
    doc.line(14, 38, 196, 38);
    
    // Invoice title
    doc.setFontSize(18);
    doc.text('INVOICE', 14, 48);
    
    // Date and Invoice Number
    const today = new Date();
    const invoiceNumber = `INV-${today.getFullYear()}${(today.getMonth() + 1).toString().padStart(2, '0')}${today.getDate().toString().padStart(2, '0')}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
    
    doc.setFontSize(10);
    doc.text(`Date: ${today.toLocaleDateString()}`, 14, 56);
    doc.text(`Invoice #: ${invoiceNumber}`, 14, 62);
    
    // Client information
    doc.setFontSize(12);
    doc.text('Bill To:', 14, 72);
    doc.setFontSize(11);
    doc.text(client, 14, 78);
    
    // Table header
    let startY = 90;
    doc.setFillColor(240, 240, 240);
    doc.rect(14, startY, 182, 8, 'F');
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.text('Description', 16, startY + 5);
    doc.text('Quantity', 100, startY + 5);
    doc.text('Unit Price', 130, startY + 5);
    doc.text('Amount', 170, startY + 5);
    
    startY += 10;
    
    // Table content
    items.forEach((item, index) => {
      doc.text(item.description, 16, startY + 5);
      doc.text(item.quantity.toString(), 100, startY + 5);
      doc.text(`$${item.price.toFixed(2)}`, 130, startY + 5);
      doc.text(`$${(item.quantity * item.price).toFixed(2)}`, 170, startY + 5);
      startY += 10;
      
      // Add light gray line
      if (index < items.length - 1) {
        doc.setDrawColor(220, 220, 220);
        doc.line(14, startY, 196, startY);
      }
    });
    
    // Total
    doc.setDrawColor(44, 62, 80);
    doc.line(14, startY + 2, 196, startY + 2);
    doc.setFontSize(12);
    doc.setTextColor(44, 62, 80);
    doc.text(`Total: $${total.toFixed(2)}`, 170, startY + 10);
    
    // Footer
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('Thank you for your business!', 105, 270, { align: 'center' });
    
    doc.save('invoice.pdf');
  };

  const handleSelectContact = (contact) => {
    // Format the contact information for the client field
    const formattedClient = `${contact.name}
${contact.address || ''}
${contact.phone ? `Phone: ${contact.phone}` : ''}
${contact.email ? `Email: ${contact.email}` : ''}`.trim();
    
    setClient(formattedClient);
  };

  return (
    <div className="container mt-4">
      <div className="card shadow">
        <div className="card-header bg-primary text-white">
          <h2 className="mb-0">Create Professional Invoice</h2>
        </div>
        <div className="card-body">
          {message && <div className="alert alert-info">{message}</div>}
          
          {!localStorage.getItem('token') && (
            <div className="alert alert-warning mb-4">
              <div className="d-flex align-items-center">
                <i className="bi bi-info-circle-fill me-2 fs-4"></i>
                <div>
                  <strong>You're using InvoicePro as a guest</strong>
                  <p className="mb-0">You can create and export invoices as PDF, but you need to <a href="/login">login</a> or <a href="/register">register</a> to save them to your account.</p>
                </div>
              </div>
            </div>
          )}
          
          <div className="row mb-4">
            <div className="col-md-6">
              <h5>Your Company Information</h5>
              <div className="form-group mb-2">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Company Name"
                  value={companyInfo.name}
                  onChange={(e) => setCompanyInfo({...companyInfo, name: e.target.value})}
                />
              </div>
              <div className="form-group mb-2">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Company Address"
                  value={companyInfo.address}
                  onChange={(e) => setCompanyInfo({...companyInfo, address: e.target.value})}
                />
              </div>
              <div className="row">
                <div className="col-md-6">
                  <div className="form-group mb-2">
                    <input
                      type="email"
                      className="form-control"
                      placeholder="Email"
                      value={companyInfo.email}
                      onChange={(e) => setCompanyInfo({...companyInfo, email: e.target.value})}
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group mb-2">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Phone"
                      value={companyInfo.phone}
                      onChange={(e) => setCompanyInfo({...companyInfo, phone: e.target.value})}
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="col-md-6">
              <h5>Client Information</h5>
              <div className="form-group mb-2">
                <textarea
                  className="form-control"
                  placeholder="Client name and address"
                  value={client}
                  onChange={(e) => setClient(e.target.value)}
                  rows="5"
                />
              </div>
              {localStorage.getItem('token') && (
                <button 
                  type="button" 
                  className="btn btn-outline-primary btn-sm"
                  onClick={() => setShowContactModal(true)}
                >
                  <i className="bi bi-person-rolodex me-1"></i> Select from Address Book
                </button>
              )}
            </div>
          </div>
          
          <h5>Invoice Items</h5>
          <div className="table-responsive">
            <table className="table table-bordered">
              <thead className="table-light">
                <tr>
                  <th>Description</th>
                  <th>Quantity</th>
                  <th>Price ($)</th>
                  <th>Amount</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={index}>
                    <td>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Description"
                        value={item.description}
                        onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        className="form-control"
                        placeholder="Quantity"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        className="form-control"
                        placeholder="Price"
                        value={item.price}
                        onChange={(e) => handleItemChange(index, 'price', e.target.value)}
                      />
                    </td>
                    <td>${(item.quantity * item.price).toFixed(2)}</td>
                    <td>
                      <button 
                        className="btn btn-sm btn-danger"
                        onClick={() => removeItem(index)}
                        disabled={items.length === 1}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan="5">
                    <button className="btn btn-sm btn-success" onClick={addItem}>
                      Add Item
                    </button>
                  </td>
                </tr>
                <tr>
                  <td colSpan="3" className="text-end"><strong>Total:</strong></td>
                  <td colSpan="2"><strong>${total.toFixed(2)}</strong></td>
                </tr>
              </tfoot>
            </table>
          </div>
          
          <div className="d-flex justify-content-end mt-3">
            <button 
              className="btn btn-primary me-2" 
              onClick={handleSaveInvoice}
            >
              Save Invoice
            </button>
            <button 
              className="btn btn-success" 
              onClick={handleExportPDF}
            >
              Export as PDF
            </button>
          </div>
        </div>
      </div>
      
      {/* Contact Selection Modal */}
      <ContactSelectionModal 
        show={showContactModal}
        onClose={() => setShowContactModal(false)}
        onSelectContact={handleSelectContact}
      />
    </div>
  );
}

export default InvoiceForm;

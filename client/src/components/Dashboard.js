import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { jsPDF } from 'jspdf';

function Dashboard() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchInvoices = async () => {
      const token = localStorage.getItem('token');
      try {
        const response = await axios.get('http://localhost:5000/api/invoice', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setInvoices(response.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to load invoices. Please try again later.');
        setLoading(false);
      }
    };

    fetchInvoices();
  }, []);

  const regeneratePDF = (invoice) => {
    const doc = new jsPDF();
    
    // Add company header
    doc.setFontSize(20);
    doc.setTextColor(44, 62, 80);
    doc.text(invoice.companyInfo.name, 105, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.text(invoice.companyInfo.address, 105, 28, { align: 'center' });
    doc.text(`Email: ${invoice.companyInfo.email} | Phone: ${invoice.companyInfo.phone}`, 105, 34, { align: 'center' });
    
    // Add horizontal line
    doc.setDrawColor(44, 62, 80);
    doc.line(14, 38, 196, 38);
    
    // Invoice title
    doc.setFontSize(18);
    doc.text('INVOICE', 14, 48);
    
    // Client information
    doc.setFontSize(12);
    doc.text('Bill To:', 14, 72);
    doc.setFontSize(11);
    doc.text(invoice.client, 14, 78);
    
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
    invoice.items.forEach((item, index) => {
      doc.text(item.description, 16, startY + 5);
      doc.text(item.quantity.toString(), 100, startY + 5);
      doc.text(`$${item.price.toFixed(2)}`, 130, startY + 5);
      doc.text(`$${(item.quantity * item.price).toFixed(2)}`, 170, startY + 5);
      startY += 10;
      
      // Add light gray line
      if (index < invoice.items.length - 1) {
        doc.setDrawColor(220, 220, 220);
        doc.line(14, startY, 196, startY);
      }
    });
    
    // Total
    doc.setDrawColor(44, 62, 80);
    doc.line(14, startY + 2, 196, startY + 2);
    doc.setFontSize(12);
    doc.setTextColor(44, 62, 80);
    doc.text(`Total: $${invoice.total.toFixed(2)}`, 170, startY + 10);
    
    // Footer
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('Thank you for your business!', 105, 270, { align: 'center' });
    
    doc.save(`invoice-${invoice.id}.pdf`);
  };

  if (loading) {
    return (
      <div className="container mt-5">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading your invoices...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="mb-0">Your Invoices</h1>
        <Link to="/create" className="btn btn-primary">
          <i className="bi bi-plus-lg me-1"></i> New Invoice
        </Link>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {invoices.length === 0 ? (
        <div className="card shadow-sm">
          <div className="card-body text-center p-5">
            <i className="bi bi-file-earmark-text text-muted" style={{ fontSize: '4rem' }}></i>
            <h3 className="mt-3">No Invoices Yet</h3>
            <p className="text-muted mb-4">You haven't created any invoices yet. Create your first invoice to get started.</p>
            <Link to="/create" className="btn btn-primary px-4">
              Create Your First Invoice
            </Link>
          </div>
        </div>
      ) : (
        <div className="row">
          {invoices.map((invoice) => (
            <div className="col-md-6 col-lg-4 mb-4" key={invoice.id}>
              <div className="card h-100 shadow-sm">
                <div className="card-header bg-light">
                  <h5 className="mb-0 text-truncate">{invoice.client}</h5>
                </div>
                <div className="card-body">
                  <div className="mb-3">
                    <small className="text-muted">Date:</small>
                    <div>{new Date(invoice.createdAt).toLocaleDateString()}</div>
                  </div>
                  <div className="mb-3">
                    <small className="text-muted">Items:</small>
                    <div>{invoice.items.length} item(s)</div>
                  </div>
                  <div className="mb-3">
                    <small className="text-muted">Total:</small>
                    <div className="fw-bold">${invoice.total.toFixed(2)}</div>
                  </div>
                </div>
                <div className="card-footer bg-white border-top-0">
                  <div className="d-flex justify-content-between">
                    <button 
                      className="btn btn-sm btn-outline-primary" 
                      onClick={() => regeneratePDF(invoice)}
                    >
                      <i className="bi bi-file-pdf me-1"></i> Export PDF
                    </button>
                    <button className="btn btn-sm btn-outline-secondary">
                      <i className="bi bi-envelope me-1"></i> Send
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Dashboard;

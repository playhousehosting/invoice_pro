import React from 'react';
import { Link } from 'react-router-dom';

function Home() {
  return (
    <div className="container mt-4">
      <div className="row align-items-center">
        <div className="col-lg-6">
          <h1 className="display-4 fw-bold text-primary mb-3">Professional Invoices for Your IT Consulting Business</h1>
          <p className="lead mb-4">
            Create beautiful, professional invoices in minutes. InvoicePro helps IT consultants streamline their billing process with a modern, easy-to-use interface.
          </p>
          <div className="d-flex gap-3 mb-5">
            <Link to="/create" className="btn btn-primary btn-lg px-4">
              Create Invoice
            </Link>
            <Link to="/register" className="btn btn-outline-primary btn-lg px-4">
              Sign Up Free
            </Link>
          </div>
          
          <div className="row mt-5">
            <div className="col-md-4">
              <div className="d-flex align-items-center mb-2">
                <i className="bi bi-lightning-charge fs-4 text-primary me-2"></i>
                <h5 className="mb-0">Fast & Easy</h5>
              </div>
              <p className="text-muted">Create professional invoices in just a few clicks</p>
            </div>
            <div className="col-md-4">
              <div className="d-flex align-items-center mb-2">
                <i className="bi bi-file-pdf fs-4 text-primary me-2"></i>
                <h5 className="mb-0">PDF Export</h5>
              </div>
              <p className="text-muted">Download your invoices as professional PDFs</p>
            </div>
            <div className="col-md-4">
              <div className="d-flex align-items-center mb-2">
                <i className="bi bi-cloud-arrow-up fs-4 text-primary me-2"></i>
                <h5 className="mb-0">Cloud Storage</h5>
              </div>
              <p className="text-muted">Save and access your invoices from anywhere</p>
            </div>
          </div>
        </div>
        <div className="col-lg-6">
          <img 
            src="https://cdn.pixabay.com/photo/2018/03/01/09/33/business-3190209_1280.jpg" 
            alt="Invoice illustration" 
            className="img-fluid rounded shadow-lg"
          />
        </div>
      </div>

      <div className="row mt-5 pt-5">
        <div className="col-12 text-center mb-4">
          <h2 className="fw-bold">How It Works</h2>
          <p className="lead text-muted">Three simple steps to professional invoicing</p>
        </div>
        <div className="col-md-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body text-center p-4">
              <div className="rounded-circle bg-primary text-white d-inline-flex align-items-center justify-content-center mb-3" style={{width: "60px", height: "60px"}}>
                <h3 className="mb-0">1</h3>
              </div>
              <h4>Create Your Invoice</h4>
              <p className="text-muted">Fill in your company details, client information, and itemize your services</p>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body text-center p-4">
              <div className="rounded-circle bg-primary text-white d-inline-flex align-items-center justify-content-center mb-3" style={{width: "60px", height: "60px"}}>
                <h3 className="mb-0">2</h3>
              </div>
              <h4>Preview & Export</h4>
              <p className="text-muted">Preview your invoice and export it as a professional PDF</p>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body text-center p-4">
              <div className="rounded-circle bg-primary text-white d-inline-flex align-items-center justify-content-center mb-3" style={{width: "60px", height: "60px"}}>
                <h3 className="mb-0">3</h3>
              </div>
              <h4>Save & Send</h4>
              <p className="text-muted">Create an account to save your invoices and send them directly to clients</p>
            </div>
          </div>
        </div>
      </div>

      <div className="row mt-5 pt-5 mb-5">
        <div className="col-md-8 offset-md-2 text-center">
          <h2 className="fw-bold mb-4">Ready to streamline your invoicing?</h2>
          <p className="lead mb-4">
            You can create invoices without signing up, but you'll need an account to save and send them.
          </p>
          <div className="d-flex justify-content-center gap-3">
            <Link to="/create" className="btn btn-primary btn-lg px-4">
              Try It Now
            </Link>
            <Link to="/register" className="btn btn-outline-primary btn-lg px-4">
              Create Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;

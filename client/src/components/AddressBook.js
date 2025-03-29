import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function AddressBook({ onSelectContact = null, isModal = false }) {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [currentContact, setCurrentContact] = useState({
    name: '',
    email: '',
    address: '',
    phone: ''
  });
  const [formMode, setFormMode] = useState('add'); // 'add' or 'edit'
  const navigate = useNavigate();

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      if (!isModal) navigate('/login');
      return;
    }

    try {
      const response = await axios.get('http://localhost:5000/api/address-book', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setContacts(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load contacts. Please try again later.');
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentContact({ ...currentContact, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      if (formMode === 'add') {
        const response = await axios.post(
          'http://localhost:5000/api/address-book',
          currentContact,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setContacts([...contacts, response.data]);
      } else {
        const response = await axios.put(
          `http://localhost:5000/api/address-book/${currentContact.id}`,
          currentContact,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setContacts(
          contacts.map(contact => 
            contact.id === currentContact.id ? response.data : contact
          )
        );
      }
      resetForm();
    } catch (err) {
      setError('Failed to save contact. Please try again.');
    }
  };

  const handleEdit = (contact) => {
    setCurrentContact(contact);
    setFormMode('edit');
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this contact?')) return;
    
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      await axios.delete(`http://localhost:5000/api/address-book/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setContacts(contacts.filter(contact => contact.id !== id));
    } catch (err) {
      setError('Failed to delete contact. Please try again.');
    }
  };

  const resetForm = () => {
    setCurrentContact({
      name: '',
      email: '',
      address: '',
      phone: ''
    });
    setFormMode('add');
    setShowForm(false);
  };

  const handleSelectContact = (contact) => {
    if (onSelectContact) {
      onSelectContact(contact);
    }
  };

  if (loading) {
    return (
      <div className="text-center my-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2">Loading contacts...</p>
      </div>
    );
  }

  return (
    <div className={isModal ? '' : 'container mt-4'}>
      {!isModal && (
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1 className="mb-0">Address Book</h1>
          <button 
            className="btn btn-primary" 
            onClick={() => {
              setShowForm(!showForm);
              if (showForm) resetForm();
            }}
          >
            {showForm ? (
              <>
                <i className="bi bi-x-lg me-1"></i> Cancel
              </>
            ) : (
              <>
                <i className="bi bi-plus-lg me-1"></i> Add Contact
              </>
            )}
          </button>
        </div>
      )}

      {error && <div className="alert alert-danger">{error}</div>}

      {showForm && (
        <div className="card shadow-sm mb-4">
          <div className="card-header bg-light">
            <h5 className="mb-0">{formMode === 'add' ? 'Add New Contact' : 'Edit Contact'}</h5>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label htmlFor="name" className="form-label">Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    id="name"
                    name="name"
                    value={currentContact.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label htmlFor="email" className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-control"
                    id="email"
                    name="email"
                    value={currentContact.email}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              <div className="mb-3">
                <label htmlFor="address" className="form-label">Address</label>
                <textarea
                  className="form-control"
                  id="address"
                  name="address"
                  rows="3"
                  value={currentContact.address}
                  onChange={handleInputChange}
                ></textarea>
              </div>
              <div className="mb-3">
                <label htmlFor="phone" className="form-label">Phone</label>
                <input
                  type="text"
                  className="form-control"
                  id="phone"
                  name="phone"
                  value={currentContact.phone}
                  onChange={handleInputChange}
                />
              </div>
              <div className="d-flex justify-content-end">
                <button 
                  type="button" 
                  className="btn btn-outline-secondary me-2"
                  onClick={resetForm}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {formMode === 'add' ? 'Add Contact' : 'Update Contact'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {contacts.length === 0 ? (
        <div className="card shadow-sm">
          <div className="card-body text-center p-5">
            <i className="bi bi-person-rolodex text-muted" style={{ fontSize: '4rem' }}></i>
            <h3 className="mt-3">No Contacts Yet</h3>
            <p className="text-muted mb-4">Your address book is empty. Add your first contact to get started.</p>
            <button 
              className="btn btn-primary px-4"
              onClick={() => setShowForm(true)}
            >
              Add Your First Contact
            </button>
          </div>
        </div>
      ) : (
        <div className="row">
          {contacts.map((contact) => (
            <div className="col-md-6 col-lg-4 mb-4" key={contact.id}>
              <div className="card h-100 shadow-sm">
                <div className="card-header bg-light d-flex justify-content-between align-items-center">
                  <h5 className="mb-0 text-truncate">{contact.name}</h5>
                  <div className="dropdown">
                    <button 
                      className="btn btn-sm btn-light" 
                      type="button" 
                      data-bs-toggle="dropdown"
                    >
                      <i className="bi bi-three-dots-vertical"></i>
                    </button>
                    <ul className="dropdown-menu dropdown-menu-end">
                      <li>
                        <button 
                          className="dropdown-item" 
                          onClick={() => handleEdit(contact)}
                        >
                          <i className="bi bi-pencil me-2"></i> Edit
                        </button>
                      </li>
                      <li>
                        <button 
                          className="dropdown-item text-danger" 
                          onClick={() => handleDelete(contact.id)}
                        >
                          <i className="bi bi-trash me-2"></i> Delete
                        </button>
                      </li>
                    </ul>
                  </div>
                </div>
                <div className="card-body">
                  {contact.email && (
                    <div className="mb-2">
                      <i className="bi bi-envelope text-muted me-2"></i>
                      <span>{contact.email}</span>
                    </div>
                  )}
                  {contact.phone && (
                    <div className="mb-2">
                      <i className="bi bi-telephone text-muted me-2"></i>
                      <span>{contact.phone}</span>
                    </div>
                  )}
                  {contact.address && (
                    <div className="mb-2">
                      <i className="bi bi-geo-alt text-muted me-2"></i>
                      <span>{contact.address}</span>
                    </div>
                  )}
                </div>
                {isModal && (
                  <div className="card-footer bg-white border-top-0">
                    <button 
                      className="btn btn-primary w-100" 
                      onClick={() => handleSelectContact(contact)}
                    >
                      Select Contact
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AddressBook;

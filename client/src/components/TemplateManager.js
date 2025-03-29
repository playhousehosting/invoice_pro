import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

function TemplateManager() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentTemplate, setCurrentTemplate] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    companyInfo: {
      name: '',
      address: '',
      phone: '',
      email: ''
    },
    items: [{ description: '', quantity: 1, rate: 0 }]
  });

  const navigate = useNavigate();

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await api.get('/api/templates');
      setTemplates(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching templates:', error);
      setError('Failed to load templates');
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (currentTemplate) {
        await api.put(`/api/templates/${currentTemplate.id}`, formData);
      } else {
        await api.post('/api/templates', formData);
      }
      fetchTemplates();
      resetForm();
    } catch (error) {
      console.error('Error saving template:', error);
      setError('Failed to save template');
    }
  };

  const handleEdit = (template) => {
    setCurrentTemplate(template);
    setFormData({
      name: template.name,
      companyInfo: template.companyInfo,
      items: template.items
    });
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      try {
        await api.delete(`/api/templates/${id}`);
        fetchTemplates();
      } catch (error) {
        console.error('Error deleting template:', error);
        setError('Failed to delete template');
      }
    }
  };

  const handleUseTemplate = (template) => {
    // Store the template in localStorage
    localStorage.setItem('currentTemplate', JSON.stringify(template));
    // Navigate to invoice creation with the template
    navigate('/create');
  };

  const resetForm = () => {
    setCurrentTemplate(null);
    setFormData({
      name: '',
      companyInfo: {
        name: '',
        address: '',
        phone: '',
        email: ''
      },
      items: [{ description: '', quantity: 1, rate: 0 }]
    });
  };

  if (loading) return <div className="container mt-5">Loading...</div>;

  return (
    <div className="container mt-5">
      <div className="row">
        <div className="col-md-8">
          <h2>Invoice Templates</h2>
          {error && <div className="alert alert-danger">{error}</div>}
          
          <div className="list-group mt-3">
            {templates.map((template) => (
              <div key={template.id} className="list-group-item list-group-item-action">
                <div className="d-flex w-100 justify-content-between align-items-center">
                  <h5 className="mb-1">{template.name}</h5>
                  <div>
                    <button
                      className="btn btn-primary btn-sm me-2"
                      onClick={() => handleUseTemplate(template)}
                    >
                      Use Template
                    </button>
                    <button
                      className="btn btn-secondary btn-sm me-2"
                      onClick={() => handleEdit(template)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDelete(template.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <p className="mb-1">Company: {template.companyInfo.name}</p>
                <small>Items: {template.items.length}</small>
              </div>
            ))}
          </div>
        </div>

        <div className="col-md-4">
          <div className="card">
            <div className="card-header">
              <h3>{currentTemplate ? 'Edit Template' : 'Create Template'}</h3>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label">Template Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="mb-3">
                  <h5>Company Information</h5>
                  <input
                    type="text"
                    className="form-control mb-2"
                    placeholder="Company Name"
                    value={formData.companyInfo.name}
                    onChange={(e) => setFormData({
                      ...formData,
                      companyInfo: { ...formData.companyInfo, name: e.target.value }
                    })}
                    required
                  />
                  <input
                    type="text"
                    className="form-control mb-2"
                    placeholder="Address"
                    value={formData.companyInfo.address}
                    onChange={(e) => setFormData({
                      ...formData,
                      companyInfo: { ...formData.companyInfo, address: e.target.value }
                    })}
                  />
                  <input
                    type="tel"
                    className="form-control mb-2"
                    placeholder="Phone"
                    value={formData.companyInfo.phone}
                    onChange={(e) => setFormData({
                      ...formData,
                      companyInfo: { ...formData.companyInfo, phone: e.target.value }
                    })}
                  />
                  <input
                    type="email"
                    className="form-control"
                    placeholder="Email"
                    value={formData.companyInfo.email}
                    onChange={(e) => setFormData({
                      ...formData,
                      companyInfo: { ...formData.companyInfo, email: e.target.value }
                    })}
                  />
                </div>

                <div className="mb-3">
                  <h5>Default Items</h5>
                  {formData.items.map((item, index) => (
                    <div key={index} className="mb-2">
                      <input
                        type="text"
                        className="form-control mb-2"
                        placeholder="Description"
                        value={item.description}
                        onChange={(e) => {
                          const newItems = [...formData.items];
                          newItems[index].description = e.target.value;
                          setFormData({ ...formData, items: newItems });
                        }}
                      />
                      <div className="row">
                        <div className="col">
                          <input
                            type="number"
                            className="form-control"
                            placeholder="Quantity"
                            value={item.quantity}
                            onChange={(e) => {
                              const newItems = [...formData.items];
                              newItems[index].quantity = Number(e.target.value);
                              setFormData({ ...formData, items: newItems });
                            }}
                          />
                        </div>
                        <div className="col">
                          <input
                            type="number"
                            className="form-control"
                            placeholder="Rate"
                            value={item.rate}
                            onChange={(e) => {
                              const newItems = [...formData.items];
                              newItems[index].rate = Number(e.target.value);
                              setFormData({ ...formData, items: newItems });
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setFormData({
                      ...formData,
                      items: [...formData.items, { description: '', quantity: 1, rate: 0 }]
                    })}
                  >
                    Add Item
                  </button>
                </div>

                <div className="d-grid gap-2">
                  <button type="submit" className="btn btn-primary">
                    {currentTemplate ? 'Update Template' : 'Save Template'}
                  </button>
                  {currentTemplate && (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={resetForm}
                    >
                      Cancel Edit
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TemplateManager;

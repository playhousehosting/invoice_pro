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
      const response = await api.get('/templates');
      // Ensure templates is always an array
      const templates = response.data?.data || [];
      setTemplates(Array.isArray(templates) ? templates : []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching templates:', error);
      setError(error.response?.data?.message || 'Failed to load templates');
      setTemplates([]); // Set empty array on error
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
      companyInfo: template.companyInfo || {
        name: '',
        address: '',
        phone: '',
        email: ''
      },
      items: template.items || [{ description: '', quantity: 1, rate: 0 }]
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="lg:w-2/3">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Invoice Templates</h2>
            <button
              onClick={resetForm}
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              New Template
            </button>
          </div>
          
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}
          
          {templates.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <p className="text-gray-500">No templates found. Create your first template!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {templates.map((template) => (
                <div 
                  key={template.id} 
                  className="bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{template.name}</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Company: {template.companyInfo?.name || 'Not specified'}
                      </p>
                      <p className="text-sm text-gray-500">
                        Items: {template.items?.length || 0}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleUseTemplate(template)}
                        className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                      >
                        Use
                      </button>
                      <button
                        onClick={() => handleEdit(template)}
                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(template.id)}
                        className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="lg:w-1/3">
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {currentTemplate ? 'Edit Template' : 'Create Template'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Template Name
                </label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Company Information</h4>
                <div>
                  <label className="block text-sm text-gray-700">Company Name</label>
                  <input
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    value={formData.companyInfo.name}
                    onChange={(e) => setFormData({
                      ...formData,
                      companyInfo: { ...formData.companyInfo, name: e.target.value }
                    })}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700">Address</label>
                  <textarea
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    value={formData.companyInfo.address}
                    onChange={(e) => setFormData({
                      ...formData,
                      companyInfo: { ...formData.companyInfo, address: e.target.value }
                    })}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700">Phone</label>
                  <input
                    type="tel"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    value={formData.companyInfo.phone}
                    onChange={(e) => setFormData({
                      ...formData,
                      companyInfo: { ...formData.companyInfo, phone: e.target.value }
                    })}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700">Email</label>
                  <input
                    type="email"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    value={formData.companyInfo.email}
                    onChange={(e) => setFormData({
                      ...formData,
                      companyInfo: { ...formData.companyInfo, email: e.target.value }
                    })}
                  />
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                >
                  {currentTemplate ? 'Update Template' : 'Create Template'}
                </button>
                {currentTemplate && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="w-full mt-2 px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TemplateManager;

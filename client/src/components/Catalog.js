import React, { useState, useEffect } from 'react';
import api from '../utils/api';

function Catalog() {
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentItem, setCurrentItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    rate: 0,
    type: 'service'
  });

  useEffect(() => {
    fetchCatalog();
  }, []);

  const fetchCatalog = async () => {
    try {
      const response = await api.get('/catalog');
      const items = response.data?.data || [];
      setCatalog(Array.isArray(items) ? items : []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching catalog:', error);
      setError(error.response?.data?.message || 'Failed to load catalog items');
      setCatalog([]); // Set empty array on error
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (currentItem) {
        await api.put(`/api/catalog/${currentItem.id}`, formData);
      } else {
        await api.post('/api/catalog', formData);
      }
      fetchCatalog();
      resetForm();
    } catch (error) {
      console.error('Error saving catalog item:', error);
      setError('Failed to save catalog item');
    }
  };

  const handleEdit = (item) => {
    setCurrentItem(item);
    setFormData({
      name: item.name,
      description: item.description,
      rate: item.rate,
      type: item.type
    });
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await api.delete(`/api/catalog/${id}`);
        fetchCatalog();
      } catch (error) {
        console.error('Error deleting catalog item:', error);
        setError('Failed to delete catalog item');
      }
    }
  };

  const resetForm = () => {
    setCurrentItem(null);
    setFormData({
      name: '',
      description: '',
      rate: 0,
      type: 'service'
    });
  };

  if (loading) return <div className="container mt-5">Loading...</div>;

  return (
    <div className="container mt-5">
      <div className="row">
        <div className="col-md-8">
          <h2>Products & Services Catalog</h2>
          {error && <div className="alert alert-danger">{error}</div>}
          
          <div className="list-group mt-3">
            {catalog.map((item) => (
              <div key={item.id} className="list-group-item list-group-item-action">
                <div className="d-flex w-100 justify-content-between align-items-center">
                  <div>
                    <h5 className="mb-1">{item.name}</h5>
                    <p className="mb-1">{item.description}</p>
                    <small>
                      Type: {item.type} | Rate: ${item.rate}
                    </small>
                  </div>
                  <div>
                    <button
                      className="btn btn-secondary btn-sm me-2"
                      onClick={() => handleEdit(item)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDelete(item.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="col-md-4">
          <div className="card">
            <div className="card-header">
              <h3>{currentItem ? 'Edit Item' : 'Add New Item'}</h3>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label">Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-control"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Rate ($)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={formData.rate}
                    onChange={(e) => setFormData({ ...formData, rate: Number(e.target.value) })}
                    min="0"
                    step="0.01"
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Type</label>
                  <select
                    className="form-select"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  >
                    <option value="service">Service</option>
                    <option value="product">Product</option>
                  </select>
                </div>

                <div className="d-grid gap-2">
                  <button type="submit" className="btn btn-primary">
                    {currentItem ? 'Update Item' : 'Add Item'}
                  </button>
                  {currentItem && (
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

export default Catalog;

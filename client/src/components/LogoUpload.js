import React, { useState, useEffect } from 'react';
import axios from 'axios';

function LogoUpload({ onLogoChange }) {
  const [logo, setLogo] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch existing logo on component mount
  useEffect(() => {
    const fetchLogo = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const response = await axios.get('http://localhost:5000/api/upload/logo', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.data && response.data.logoPath) {
          setPreviewUrl(`http://localhost:5000${response.data.logoPath}`);
          if (onLogoChange) {
            onLogoChange(response.data.logoPath);
          }
        }
      } catch (error) {
        // Logo might not exist yet, which is fine
        console.log('No logo found');
      }
    };

    fetchLogo();
  }, [onLogoChange]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    
    if (!selectedFile) {
      return;
    }
    
    // Check file type
    if (!selectedFile.type.startsWith('image/')) {
      setError('Please select an image file.');
      return;
    }
    
    // Check file size (max 5MB)
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError('File size should be less than 5MB.');
      return;
    }
    
    setLogo(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
    setError('');
  };

  const handleUpload = async () => {
    if (!logo) {
      setError('Please select a logo to upload.');
      return;
    }
    
    const token = localStorage.getItem('token');
    if (!token) {
      setError('You must be logged in to upload a logo.');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    const formData = new FormData();
    formData.append('logo', logo);
    
    try {
      const response = await axios.post('http://localhost:5000/api/upload/logo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });
      
      setSuccess('Logo uploaded successfully!');
      
      if (response.data && response.data.logoPath) {
        if (onLogoChange) {
          onLogoChange(response.data.logoPath);
        }
      }
    } catch (error) {
      setError('Failed to upload logo. Please try again.');
      console.error('Upload error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveLogo = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      await axios.delete('http://localhost:5000/api/upload/logo', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setPreviewUrl('');
      setLogo(null);
      setSuccess('Logo removed successfully!');
      
      if (onLogoChange) {
        onLogoChange(null);
      }
    } catch (error) {
      setError('Failed to remove logo. Please try again.');
      console.error('Remove logo error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="logo-upload">
      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}
      
      <div className="mb-3">
        <label className="form-label">Company Logo</label>
        <div className="d-flex align-items-center">
          {previewUrl ? (
            <div className="position-relative me-3">
              <img 
                src={previewUrl} 
                alt="Company Logo" 
                className="img-thumbnail" 
                style={{ maxHeight: '100px', maxWidth: '200px' }}
              />
            </div>
          ) : (
            <div className="border rounded p-3 text-center me-3" style={{ width: '150px', height: '100px' }}>
              <i className="bi bi-image text-muted" style={{ fontSize: '2rem' }}></i>
              <p className="small text-muted mb-0">No logo</p>
            </div>
          )}
          
          <div className="d-flex flex-column">
            <input
              type="file"
              className="form-control form-control-sm mb-2"
              accept="image/*"
              onChange={handleFileChange}
              disabled={loading}
            />
            <div className="d-flex">
              <button
                type="button"
                className="btn btn-primary btn-sm me-2"
                onClick={handleUpload}
                disabled={!logo || loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                    Uploading...
                  </>
                ) : (
                  'Upload Logo'
                )}
              </button>
              {previewUrl && (
                <button
                  type="button"
                  className="btn btn-outline-danger btn-sm"
                  onClick={handleRemoveLogo}
                  disabled={loading}
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        </div>
        <small className="text-muted">
          Upload your company logo to appear on invoices. Max size: 5MB. Recommended format: PNG or JPG.
        </small>
      </div>
    </div>
  );
}

export default LogoUpload;

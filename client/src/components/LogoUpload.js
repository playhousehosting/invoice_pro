import React, { useState, useEffect } from 'react';
import api, { getAssetUrl } from '../utils/api';

function LogoUpload({ onLogoChange }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [hasLogo, setHasLogo] = useState(false);

  useEffect(() => {
    fetchCurrentLogo();
  }, []);

  const fetchCurrentLogo = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await api.get('/api/upload/logo');
      if (response.data.logoPath) {
        setHasLogo(true);
        setPreviewUrl(getAssetUrl(response.data.logoPath));
        if (onLogoChange) {
          onLogoChange(response.data.logoPath);
        }
      }
    } catch (err) {
      console.error('Error fetching logo:', err);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.match('image.*')) {
      setMessage('Please select an image file (PNG, JPG, JPEG, GIF)');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setMessage('File size should be less than 2MB');
      return;
    }

    setSelectedFile(file);
    setMessage('');

    // Create preview
    const reader = new FileReader();
    reader.onload = () => {
      setPreviewUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setMessage('Please select a file to upload');
      return;
    }

    setUploading(true);
    setMessage('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setMessage('You must be logged in to upload a logo.');
        return;
      }

      const formData = new FormData();
      formData.append('logo', selectedFile);

      const response = await api.post('/api/upload/logo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setMessage('Logo uploaded successfully');
      setHasLogo(true);
      setSelectedFile(null);
      if (response.data && response.data.logoPath) {
        if (onLogoChange) {
          onLogoChange(response.data.logoPath);
        }
      }
    } catch (err) {
      console.error('Upload error:', err);
      setMessage(err.response?.data?.message || 'Failed to upload logo');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveLogo = async () => {
    if (!window.confirm('Are you sure you want to remove your logo?')) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      await api.delete('/api/upload/logo');
      setPreviewUrl('');
      setHasLogo(false);
      setMessage('Logo removed successfully');
      if (onLogoChange) {
        onLogoChange(null);
      }
    } catch (err) {
      console.error('Remove logo error:', err);
      setMessage(err.response?.data?.message || 'Failed to remove logo');
    }
  };

  return (
    <div className="logo-upload">
      {message && (
        <div className={`alert ${message.includes('successfully') ? 'alert-success' : 'alert-danger'}`}>
          {message}
        </div>
      )}

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
              disabled={uploading}
            />
            <div className="d-flex">
              <button
                type="button"
                className="btn btn-primary btn-sm me-2"
                onClick={handleUpload}
                disabled={!selectedFile || uploading}
              >
                {uploading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                    Uploading...
                  </>
                ) : (
                  'Upload Logo'
                )}
              </button>
              {hasLogo && (
                <button
                  type="button"
                  className="btn btn-outline-danger btn-sm"
                  onClick={handleRemoveLogo}
                  disabled={uploading}
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        </div>
        <small className="text-muted">
          Upload your company logo to appear on invoices. Max size: 2MB. Recommended format: PNG or JPG.
        </small>
      </div>
    </div>
  );
}

export default LogoUpload;

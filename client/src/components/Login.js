import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      if (!email || !password) {
        throw new Error('Please enter both email and password.');
      }

      const res = await api.post('/api/auth/login', {
        email,
        password
      });
      
      if (res.data && res.data.token) {
        localStorage.setItem('token', res.data.token);
        // Ensure the token is immediately available for subsequent requests
        api.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
        navigate('/invoice');
      } else {
        throw new Error('Invalid response from server: No token received');
      }
    } catch (err) {
      console.error('Login error:', err);
      let errorMessage = 'Login failed. ';

      if (err.response) {
        // Server responded with an error
        if (err.response.status === 401) {
          errorMessage += 'Invalid email or password.';
        } else if (err.response.status === 500) {
          errorMessage += 'Server error. Please try again later.';
        } else {
          errorMessage += err.response.data?.message || 'Please check your credentials and try again.';
        }
      } else if (err.request) {
        // Request was made but no response received
        errorMessage += 'No response from server. Please check your internet connection.';
      } else {
        // Error in request setup
        errorMessage += err.message || 'An unexpected error occurred.';
      }

      setMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card shadow">
            <div className="card-header bg-primary text-white">
              <h2 className="mb-0">Login</h2>
            </div>
            <div className="card-body">
              {message && <div className="alert alert-danger">{message}</div>}
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="email" className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-control"
                    id="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="password" className="form-label">Password</label>
                  <input
                    type="password"
                    className="form-control"
                    id="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
                <button 
                  type="submit" 
                  className="btn btn-primary w-100"
                  disabled={isLoading}
                >
                  {isLoading ? 'Logging in...' : 'Login'}
                </button>
              </form>
              <div className="mt-3 text-center">
                <Link to="/register">Don't have an account? Register here</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;

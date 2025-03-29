import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import api from '../utils/api';

function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get current user info
        const userResponse = await api.get('/api/auth/me');
        setCurrentUser(userResponse.data);

        // Only fetch users if current user is admin
        if (userResponse.data.role === 'ADMIN') {
          const usersResponse = await api.get('/api/admin/users');
          setUsers(usersResponse.data);
        }
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.response?.data?.message || 'Failed to load dashboard');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    try {
      await api.put(`/api/admin/users/${userId}/role`, { role: newRole });
      setUsers(users.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
      ));
    } catch (err) {
      console.error('Error updating user role:', err);
      setError(err.response?.data?.message || 'Failed to update user role');
    }
  };

  if (loading) {
    return <div className="container mt-5">Loading...</div>;
  }

  if (!currentUser || currentUser.role !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }

  if (error) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger">{error}</div>
      </div>
    );
  }

  return (
    <div className="container mt-5">
      <h2 className="mb-4">Admin Dashboard</h2>
      
      <div className="card shadow">
        <div className="card-header bg-primary text-white">
          <h3 className="mb-0">User Management</h3>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Created At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id}>
                    <td>{user.name || 'N/A'}</td>
                    <td>{user.email}</td>
                    <td>{user.role}</td>
                    <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td>
                      <select
                        className="form-select"
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        disabled={user.id === currentUser.id}
                      >
                        <option value="USER">User</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;

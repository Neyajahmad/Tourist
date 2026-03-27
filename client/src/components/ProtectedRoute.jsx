import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  
  // Debug logging
  console.log('ProtectedRoute check:', { 
    adminOnly, 
    token: token ? 'exists' : 'missing', 
    role,
    willRedirect: !token || (adminOnly && role !== 'admin') || (!adminOnly && role === 'admin')
  });
  
  // Check if user is authenticated
  if (!token) {
    console.log('No token found, redirecting to login');
    return <Navigate to={adminOnly ? "/admin-login" : "/login"} replace />;
  }
  
  // Admin-only route: only allow admin role
  if (adminOnly && role !== 'admin') {
    console.log('Admin route but role is not admin:', role);
    return <Navigate to="/admin-login" replace />;
  }
  
  // Regular user route: block admin from accessing
  if (!adminOnly && role === 'admin') {
    console.log('User route but role is admin, redirecting to admin dashboard');
    return <Navigate to="/admin-dashboard" replace />;
  }
  
  console.log('Access granted');
  return children;
};

export default ProtectedRoute;

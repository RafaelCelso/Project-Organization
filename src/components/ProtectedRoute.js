import React from 'react';
import { Navigate } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import { usePermissions } from '../hooks/usePermissions';

export const ProtectedRoute = ({ children, requiredPermission, menu }) => {
  const { loading, hasAccess, isAdmin } = usePermissions();
  const auth = getAuth();
  const user = auth.currentUser;

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Carregando...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (isAdmin()) {
    return children;
  }

  if (menu && !hasAccess(menu)) {
    return <Navigate to="/acesso-negado" />;
  }

  return children;
}; 
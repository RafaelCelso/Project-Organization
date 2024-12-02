import React from 'react';
import { Navigate } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import { usePermissions } from '../hooks/usePermissions';

export const ProtectedRoute = ({ children, requiredPermission, menu }) => {
  const { loading, can, hasAccess, isAdmin, userRole, userPermissions } = usePermissions();
  const auth = getAuth();
  const user = auth.currentUser;

  console.log('[ProtectedRoute] Iniciando verificações:', {
    loading,
    userEmail: user?.email,
    userRole,
    isAdmin: isAdmin(),
    menu,
    requiredPermission
  });

  if (loading) {
    console.log('[ProtectedRoute] Carregando...');
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Carregando...</p>
      </div>
    );
  }

  if (!user) {
    console.log('[ProtectedRoute] Usuário não autenticado');
    return <Navigate to="/login" />;
  }

  const adminAccess = isAdmin();
  console.log('[ProtectedRoute] Verificação de admin:', { adminAccess, userRole });

  if (adminAccess) {
    console.log('[ProtectedRoute] Acesso garantido - usuário é admin');
    return children;
  }

  if (menu) {
    const menuAccess = hasAccess(menu);
    console.log('[ProtectedRoute] Verificação de acesso ao menu:', { menu, menuAccess });
    if (!menuAccess) {
      return <Navigate to="/acesso-negado" />;
    }
  }

  if (requiredPermission) {
    const permissionAccess = can(requiredPermission);
    console.log('[ProtectedRoute] Verificação de permissão específica:', { 
      requiredPermission, 
      permissionAccess 
    });
    if (!permissionAccess) {
      return <Navigate to="/acesso-negado" />;
    }
  }

  console.log('[ProtectedRoute] Acesso permitido');
  return children;
}; 
import React from 'react';
import { usePermissions } from '../hooks/usePermissions';

const Sidebar = () => {
  const { hasAccess } = usePermissions();

  const menuItems = [
    {
      title: 'Projetos',
      path: '/projetos',
      icon: <i className="material-icons">folder</i>,
      permission: 'projetos'
    },
    {
      title: 'Colaboradores',
      path: '/colaboradores',
      icon: <i className="material-icons">people</i>,
      permission: 'colaboradores'
    },
    // ... outros itens de menu ...
  ];

  return (
    <nav className="sidebar-nav">
      {menuItems.map((item) => {
        const canAccess = hasAccess(item.permission);
        console.log(`Verificando acesso ao menu ${item.title}:`, canAccess);
        
        return canAccess ? (
          <div key={item.path} className="nav-item">
            <a href={item.path}>
              {item.icon}
              <span>{item.title}</span>
            </a>
          </div>
        ) : null;
      })}
    </nav>
  );
};

export default Sidebar; 
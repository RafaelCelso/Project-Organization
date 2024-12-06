import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHome, faProjectDiagram, faUsers, faCalendarAlt, faTasks, faUser, faSignOutAlt, faUserGroup, faShieldAlt, faBook } from '@fortawesome/free-solid-svg-icons';
import ToggleButton from './components/ToggleButton';
import LogoutModal from './components/LogoutModal';
import './Sidebar.css';
import logo from './logo.png';

function Sidebar({ isCollapsed, onToggle }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const handleLogoutConfirm = () => {
    localStorage.removeItem('userInfo'); // Limpa os dados do usuário
    setShowLogoutModal(false);
    navigate('/login');
  };

  const handleLogoutCancel = () => {
    setShowLogoutModal(false);
  };

  const menuItems = [
    { icon: faHome, label: 'Início', path: '/' },
    { icon: faProjectDiagram, label: 'Projetos', path: '/projetos' },
    { icon: faUsers, label: 'Colaboradores', path: '/colaboradores' },
    { icon: faCalendarAlt, label: 'Escalas', path: '/escalas' },
    { icon: faTasks, label: 'Tarefas', path: '/tarefas' },
    { icon: faUserGroup, label: 'Usuários', path: '/usuarios' },
    { icon: faShieldAlt, label: 'Permissões', path: '/permissoes' },
    { icon: faUser, label: 'Perfil', path: '/perfil' },
    { icon: faBook, label: 'Documentação', path: '/documentacao' },
  ];

  return (
    <>
      <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
        <img src={logo} alt="Logo" className="sidebar-logo" />
        <ul>
          {menuItems.map((item) => (
            <li
              key={item.label}
              className={location.pathname === item.path ? 'active' : ''}
              onClick={() => navigate(item.path)}
            >
              <FontAwesomeIcon icon={item.icon} />
              {!isCollapsed && <span>{item.label}</span>}
            </li>
          ))}
          <li onClick={handleLogoutClick}>
            <FontAwesomeIcon icon={faSignOutAlt} />
            {!isCollapsed && <span>Sair</span>}
          </li>
        </ul>
      </div>
      <ToggleButton isCollapsed={isCollapsed} onClick={onToggle} />
      <LogoutModal 
        isOpen={showLogoutModal}
        onClose={handleLogoutCancel}
        onConfirm={handleLogoutConfirm}
      />
    </>
  );
}

export default Sidebar;